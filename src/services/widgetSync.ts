import { ExtensionStorage } from '@bacons/apple-targets';
import { Platform } from 'react-native';
import { Device } from '../types';

// Create a storage object with the App Group
const storage =
  Platform.OS === 'ios'
    ? new ExtensionStorage('group.abunchofknowitalls.remotewol-upsnap')
    : null;

interface WidgetDevice {
  id: string;
  name: string;
  mac: string;
  ip: string;
  status: string;
}

/**
 * Syncs device data to the iOS widget via App Group shared storage.
 * This allows the widget to display device information and create action deep links.
 */
export function syncDevicesToWidget(devices: Device[]): void {
  if (!storage) {
    return;
  }

  try {
    // Transform devices to the format expected by the widget
    const widgetDevices: WidgetDevice[] = devices.map(device => ({
      id: device.id,
      name: device.name,
      mac: device.mac,
      ip: device.ip,
      status: device.status || 'unknown',
    }));

    const devicesJson = JSON.stringify(widgetDevices);
    storage.set('devices', devicesJson);

    // Refresh widgets to pick up the new data
    ExtensionStorage.reloadWidget();
  } catch (error) {
    console.error('Failed to sync devices to widget:', error);
  }
}

/**
 * Refreshes all widget timelines to pick up new data.
 */
export function refreshWidgets(): void {
  if (!storage) {
    return;
  }

  try {
    ExtensionStorage.reloadWidget();
  } catch (error) {
    console.error('Failed to refresh widgets:', error);
  }
}
