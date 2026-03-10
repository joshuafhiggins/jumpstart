import {
  Device,
  AuthResponse,
  NetworkScanResult,
  PermissionResponse,
} from '../types';

class UpSnapAPI {
  private token: string | null = null;
  private address: string | null = null;
  private canCreate: boolean | null = null;
  private unauthorizedHandler: (() => Promise<void>) | null = null;
  private isHandlingUnauthorized = false;

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
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

  setUnauthorizedHandler(handler: (() => Promise<void>) | null) {
    this.unauthorizedHandler = handler;
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

  private async throwApiError(response: Response, fallbackMessage: string): Promise<never> {
    let message = fallbackMessage;

    try {
      const error = await response.json();
      message = error.message || fallbackMessage;
    } catch {
      // Ignore JSON parsing errors and use the fallback message.
    }

    const isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      /authorization token|invalid token|unauthorized|not authenticated/i.test(message);

    if (isAuthError) {
      await this.handleUnauthorized();
    }

    const error = new Error(message) as Error & {
      status?: number;
      isAuthError?: boolean;
    };

    error.status = response.status;
    error.isAuthError = isAuthError;

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

  async authenticate(
    serverAddress: string,
    identity: string,
    password: string
  ): Promise<AuthResponse> {
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
      const response = await fetch(
        `${this.address}/collections/_superusers/auth-with-password`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ identity, password }),
        }
      );

      if (!response.ok) {
        await this.throwApiError(response, 'Authentication failed');
      }

      const data: AuthResponse = await response.json();
      this.token = data.token;
      this.canCreate = true;
      return data;
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;

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
    const response = await fetch(
      `${this.address}/collections/devices/records?page=${page}&perPage=${perPage}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to fetch devices');
    }

    const data = await response.json();
    return data.items;
  }

  async getDevice(id: string): Promise<Device> {
    const response = await fetch(
      `${this.address}/collections/devices/records/${id}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to fetch device');
    }

    return response.json();
  }

  async createDevice(device: Partial<Device>): Promise<Device> {
    const response = await fetch(
      `${this.address}/collections/devices/records`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(device),
      }
    );

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to create device');
    }

    return response.json();
  }

  async updateDevice(id: string, device: Partial<Device>): Promise<Device> {
    const response = await fetch(
      `${this.address}/collections/devices/records/${id}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(device),
      }
    );

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to update device');
    }

    return response.json();
  }

  async deleteDevice(id: string): Promise<void> {
    const response = await fetch(
      `${this.address}/collections/devices/records/${id}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to delete device');
    }
  }

  async wakeDevice(id: string): Promise<void> {
    const response = await fetch(`${this.address}/upsnap/wake/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to wake device');
    }
  }

  async wakeGroup(id: string): Promise<void> {
    const response = await fetch(`${this.address}/upsnap/wakegroup/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to wake group');
    }
  }

  async sleepDevice(id: string): Promise<void> {
    const response = await fetch(`${this.address}/upsnap/sleep/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to sleep device');
    }
  }

  async rebootDevice(id: string): Promise<void> {
    const response = await fetch(`${this.address}/upsnap/reboot/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to reboot device');
    }
  }

  async shutdownDevice(id: string): Promise<void> {
    const response = await fetch(`${this.address}/upsnap/shutdown/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to shutdown device');
    }
  }

  async scanNetwork(): Promise<NetworkScanResult[]> {
    const response = await fetch(`${this.address}/upsnap/scan`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      await this.throwApiError(response, 'Failed to scan network');
    }

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
