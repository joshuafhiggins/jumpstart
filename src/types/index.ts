export interface Device {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  mac: string;
  ip: string;
  netmask: string;
  broadcast: string;
  secureOnPassword: string;
  port: number;
  groups: string[];
  status: string;
  created: string;
  updated: string;
}

export interface AuthResponse {
  token: string;
  record: User;
}

export interface User {
  id: string;
  collectionId: string;
  collectionName: string;
  username: string;
  verified: boolean;
  emailVisibility: boolean;
  email: string;
  created: string;
  updated: string;
  name: string;
  avatar: number;
}

export interface DeviceGroup {
  id: string;
  name: string;
}

export interface NetworkScanResult {
  name?: string;
  hostname?: string;
  ip?: string;
  ip_address?: string;
  mac?: string;
  mac_address?: string;
  mac_vendor?: string;
}
