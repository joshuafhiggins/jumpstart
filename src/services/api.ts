import {
  Device,
  AuthResponse,
  NetworkScanResult,
  PermissionResponse,
} from '../types';

export type AuthCollection = 'users' | '_superusers';

export type ApiError = Error & {
  status?: number;
  isAuthError?: boolean;
};

export type AuthUpdateListener = (auth: AuthResponse) => void | Promise<void>;
export type AuthFailureListener = (error: unknown) => void | Promise<void>;

const AUTH_ERROR_MESSAGE = /authorization token|invalid token|unauthorized|not authenticated/i;

export function isAuthCollection(value: unknown): value is AuthCollection {
  return value === 'users' || value === '_superusers';
}

export function isRevokedAuthError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const status = (error as { status?: unknown }).status;
  return status === 401 || status === 403 || status === 404;
}

function isSessionChanged(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { sessionChanged?: boolean }).sessionChanged === true
  );
}

class UpSnapAPI {
  private token: string | null = null;
  private address: string | null = null;
  private canCreate: boolean | null = null;
  private authCollection: AuthCollection | null = null;
  private authEpoch = 0;
  private unauthorizedHandler: (() => Promise<void>) | null = null;
  private authUpdateListener: AuthUpdateListener | null = null;
  private authFailureListener: AuthFailureListener | null = null;
  private isHandlingUnauthorized = false;
  private refreshInFlight: Promise<AuthResponse> | null = null;

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    this.authEpoch += 1;
  }

  setAddress(address: string) {
    this.address = address;
  }

  getAddress(): string | null {
    return this.address;
  }

  clearAddress() {
    this.address = null;
  }

  setCanCreate(canCreate: boolean) {
    this.canCreate = canCreate;
  }

  getCanCreate(): boolean | null {
    return this.canCreate;
  }

  clearCanCreate() {
    this.canCreate = null;
  }

  setAuthCollection(collection: AuthCollection | null) {
    this.authCollection = collection;
  }

  getAuthCollection(): AuthCollection | null {
    return this.authCollection;
  }

  clearAuthCollection() {
    this.authCollection = null;
  }

  setUnauthorizedHandler(handler: (() => Promise<void>) | null) {
    this.unauthorizedHandler = handler;
  }

  setAuthUpdateListener(listener: AuthUpdateListener | null) {
    this.authUpdateListener = listener;
  }

  setAuthFailureListener(listener: AuthFailureListener | null) {
    this.authFailureListener = listener;
  }

  private async handleUnauthorized() {
    if (!this.unauthorizedHandler || this.isHandlingUnauthorized) {
      return;
    }

    this.isHandlingUnauthorized = true;

    try {
      await this.unauthorizedHandler();
    } finally {
      this.isHandlingUnauthorized = false;
    }
  }

  private async errorFromResponse(response: Response, fallbackMessage: string): Promise<ApiError> {
    let message = fallbackMessage;

    try {
      const error = await response.json();
      message = error.message || fallbackMessage;
    } catch {
      // Ignore JSON parsing errors and use the fallback message.
    }

    const apiError = new Error(message) as ApiError;
    apiError.status = response.status;
    apiError.isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      AUTH_ERROR_MESSAGE.test(message);
    return apiError;
  }

  private async throwApiError(
    response: Response,
    fallbackMessage: string,
    skipUnauthorizedHandler = false,
  ): Promise<never> {
    const error = await this.errorFromResponse(response, fallbackMessage);

    if (error.isAuthError && !skipUnauthorizedHandler) {
      await this.handleUnauthorized();
    }

    throw error;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private sessionChanged(): ApiError {
    const error = new Error('Auth session changed') as ApiError & { sessionChanged: true };
    error.sessionChanged = true;
    error.isAuthError = true;
    return error;
  }

  /**
   * One refresh is shared by the expiry timer and every request that receives a 401.
   * PocketBase returns a new auth token and record for the same collection.
   */
  async refreshAuth(): Promise<AuthResponse> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.performRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }

    return this.refreshInFlight;
  }

  private async performRefresh(): Promise<AuthResponse> {
    const epoch = this.authEpoch;
    const tokenAtStart = this.token;

    try {
      if (!tokenAtStart || !this.address) {
        throw Object.assign(new Error('Not authenticated'), {
          status: 401,
          isAuthError: true,
        }) as ApiError;
      }

      const collections: AuthCollection[] = this.authCollection
        ? [this.authCollection]
        : ['users', '_superusers'];
      let lastError: ApiError | null = null;

      for (let index = 0; index < collections.length; index += 1) {
        const collection = collections[index];
        const response = await fetch(
          `${this.address}/collections/${collection}/auth-refresh`,
          {
            method: 'POST',
            headers: this.getHeaders(),
          },
        );

        if (this.authEpoch !== epoch || this.token !== tokenAtStart) {
          throw this.sessionChanged();
        }

        if (response.ok) {
          const data = (await response.json()) as AuthResponse;
          if (this.authEpoch !== epoch || this.token !== tokenAtStart) {
            throw this.sessionChanged();
          }
          if (!data?.token) {
            throw Object.assign(new Error('Auth refresh failed'), {
              status: 401,
              isAuthError: true,
            }) as ApiError;
          }

          this.authCollection = isAuthCollection(data.record?.collectionName)
            ? data.record.collectionName
            : collection;
          this.token = data.token;
          if (this.authCollection === '_superusers') {
            this.canCreate = true;
          }

          try {
            await this.authUpdateListener?.(data);
          } catch (error) {
            console.error('Failed to persist refreshed auth', error);
          }

          return data;
        }

        lastError = await this.errorFromResponse(response, 'Auth refresh failed');
        const tryNextCollection =
          !this.authCollection && index < collections.length - 1 && response.status === 403;
        if (!tryNextCollection) {
          throw lastError;
        }
      }

      throw (
        lastError ??
        (Object.assign(new Error('Auth refresh failed'), {
          status: 401,
          isAuthError: true,
        }) as ApiError)
      );
    } catch (error) {
      if (!isSessionChanged(error)) {
        try {
          await this.authFailureListener?.(error);
        } catch (listenerError) {
          console.error('Failed to handle auth refresh failure', listenerError);
        }
      }
      throw error;
    }
  }

  /**
   * On 401, refresh once and retry the original request.
   * A second 401, or a refresh the server rejects, ends the session.
   */
  private async request(url: string, fallbackMessage: string, init?: RequestInit): Promise<Response> {
    const send = () =>
      fetch(url, {
        ...init,
        headers: this.getHeaders(),
      });

    const response = await send();
    if (response.ok) {
      return response;
    }

    if (response.status === 401 && this.token) {
      try {
        await this.refreshAuth();
      } catch (error) {
        if (isSessionChanged(error)) {
          throw error;
        }
        if (!isRevokedAuthError(error)) {
          throw error;
        }
        await this.handleUnauthorized();
        return this.throwApiError(response, fallbackMessage, true);
      }

      const retried = await send();
      if (!retried.ok) {
        if (retried.status === 401) {
          await this.handleUnauthorized();
          return this.throwApiError(retried, fallbackMessage, true);
        }
        return this.throwApiError(retried, fallbackMessage);
      }
      return retried;
    }

    return this.throwApiError(response, fallbackMessage);
  }

  async authenticate(
    serverAddress: string,
    identity: string,
    password: string
  ): Promise<AuthResponse> {
    this.authEpoch += 1;
    this.token = null;
    this.authCollection = null;
    this.address = serverAddress + '/api';

    const response = await fetch(
      `${this.address}/collections/users/auth-with-password`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ identity, password }),
      }
    );

    if (!response.ok) {
      const superuserResponse = await fetch(
        `${this.address}/collections/_superusers/auth-with-password`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ identity, password }),
        }
      );

      if (!superuserResponse.ok) {
        await this.throwApiError(superuserResponse, 'Authentication failed');
      }

      const data: AuthResponse = await superuserResponse.json();
      this.token = data.token;
      this.authCollection = '_superusers';
      this.canCreate = true;
      return data;
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    this.authCollection = 'users';

    const userID = data.record.id;
    const userPermissionResponse = await fetch(
      `${this.address}/collections/permissions/records?filter=(user='${userID}')&expand=user,read,update,delete,power`,
      {
        headers: this.getHeaders(),
      }
    );
    if (!userPermissionResponse.ok) {
      await this.throwApiError(userPermissionResponse, 'Authentication failed');
    }

    const user: PermissionResponse = (await userPermissionResponse.json()).items[0];
    this.canCreate = user.create;

    return data;
  }

  async getDevices(page = 1, perPage = 100): Promise<Device[]> {
    const response = await this.request(
      `${this.address}/collections/devices/records?page=${page}&perPage=${perPage}`,
      'Failed to fetch devices',
    );

    const data = await response.json();
    return data.items;
  }

  async getDevice(id: string): Promise<Device> {
    const response = await this.request(
      `${this.address}/collections/devices/records/${id}`,
      'Failed to fetch device',
    );

    return response.json();
  }

  async createDevice(device: Partial<Device>): Promise<Device> {
    const response = await this.request(
      `${this.address}/collections/devices/records`,
      'Failed to create device',
      {
        method: 'POST',
        body: JSON.stringify(device),
      },
    );

    return response.json();
  }

  async updateDevice(id: string, device: Partial<Device>): Promise<Device> {
    const response = await this.request(
      `${this.address}/collections/devices/records/${id}`,
      'Failed to update device',
      {
        method: 'PATCH',
        body: JSON.stringify(device),
      },
    );

    return response.json();
  }

  async deleteDevice(id: string): Promise<void> {
    await this.request(
      `${this.address}/collections/devices/records/${id}`,
      'Failed to delete device',
      { method: 'DELETE' },
    );
  }

  async wakeDevice(id: string): Promise<void> {
    await this.request(`${this.address}/upsnap/wake/${id}`, 'Failed to wake device');
  }

  async wakeGroup(id: string): Promise<void> {
    await this.request(`${this.address}/upsnap/wakegroup/${id}`, 'Failed to wake group');
  }

  async sleepDevice(id: string): Promise<void> {
    await this.request(`${this.address}/upsnap/sleep/${id}`, 'Failed to sleep device');
  }

  async rebootDevice(id: string): Promise<void> {
    await this.request(`${this.address}/upsnap/reboot/${id}`, 'Failed to reboot device');
  }

  async shutdownDevice(id: string): Promise<void> {
    await this.request(`${this.address}/upsnap/shutdown/${id}`, 'Failed to shutdown device');
  }

  async scanNetwork(): Promise<NetworkScanResult[]> {
    const response = await this.request(`${this.address}/upsnap/scan`, 'Failed to scan network');

    const data = await response.json();
    if (data.devices && Array.isArray(data.devices)) {
      return data.devices.map((item: any) => ({
        name: item.name || item.hostname || 'Unknown',
        ip: item.ip || item.ip_address || '',
        mac: item.mac || item.mac_address || '',
        mac_vendor: item.mac_vendor || 'Unknown',
      }));
    }

    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        name: item.name || item.hostname || 'Unknown',
        ip: item.ip || item.ip_address || '',
        mac: item.mac || item.mac_address || '',
        mac_vendor: item.mac_vendor || 'Unknown',
      }));
    }

    if (data.items && Array.isArray(data.items)) {
      return data.items.map((item: any) => ({
        name: item.name || item.hostname || 'Unknown',
        ip: item.ip || item.ip_address || '',
        mac: item.mac || item.mac_address || '',
        mac_vendor: item.mac_vendor || 'Unknown',
      }));
    }

    return [];
  }
}

export default new UpSnapAPI();
