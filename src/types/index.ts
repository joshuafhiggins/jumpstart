export interface Device {
	id: string;
	collectionId: string;
	collectionName: string;
	name: string;
	mac: string;
	ip: string;
	netmask: string;
	broadcast: string;
  password: string;
  shutdown_cmd: string;
  sol_enabled: boolean;
	ports: number[];
	groups: string[];
	status: string;
	created: string;
	updated: string;
}

export interface AuthResponse {
	token: string;
	record: User;
}

export interface PermissionResponse {
  id: string;
  collectionId: string;
  collectionName: string;
  user: User;
  create: boolean;
  read: Device[];
  update: Device[];
  delete: Device[];
  power: Device[];
  created: string;
  updated: string;
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
