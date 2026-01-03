import { Device, AuthResponse, NetworkScanResult } from '../types';

const API_BASE_URL = 'https://wol.f6knight.duckdns.org/api';

class UpSnapAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
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

  async authenticate(identity: string, password: string, isSuperuser = false): Promise<AuthResponse> {
    const endpoint = isSuperuser 
      ? `${API_BASE_URL}/collections/_superusers/auth-with-password`
      : `${API_BASE_URL}/collections/users/auth-with-password`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ identity, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    return data;
  }

  async getDevices(page = 1, perPage = 30): Promise<Device[]> {
    const response = await fetch(
      `${API_BASE_URL}/collections/devices/records?page=${page}&perPage=${perPage}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }

    const data = await response.json();
    return data.items;
  }

  async getDevice(id: string): Promise<Device> {
    const response = await fetch(
      `${API_BASE_URL}/collections/devices/records/${id}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch device');
    }

    return response.json();
  }

  async createDevice(device: Partial<Device>): Promise<Device> {
    const response = await fetch(
      `${API_BASE_URL}/collections/devices/records`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(device),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create device');
    }

    return response.json();
  }

  async updateDevice(id: string, device: Partial<Device>): Promise<Device> {
    const response = await fetch(
      `${API_BASE_URL}/collections/devices/records/${id}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(device),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update device');
    }

    return response.json();
  }

  async deleteDevice(id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/collections/devices/records/${id}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete device');
    }
  }

  async wakeDevice(id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/upsnap/wake/${id}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to wake device');
    }
  }

  async wakeGroup(id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/upsnap/wakegroup/${id}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to wake group');
    }
  }

  async sleepDevice(id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/upsnap/sleep/${id}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to sleep device');
    }
  }

  async rebootDevice(id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/upsnap/reboot/${id}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to reboot device');
    }
  }

  async shutdownDevice(id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/upsnap/shutdown/${id}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to shutdown device');
    }
  }

  async scanNetwork(): Promise<NetworkScanResult[]> {
    const response = await fetch(
      `${API_BASE_URL}/upsnap/scan`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to scan network');
    }

    const data = await response.json();
    console.log('Raw scan data:', data);
    
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
