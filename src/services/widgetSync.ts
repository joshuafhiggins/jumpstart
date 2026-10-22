import { setEntityCatalogAsync, isAvailable as appIntentsAvailable } from 'expo-app-intents';
import type { AppIntentEntity } from 'expo-app-intents';
import { Platform } from 'react-native';
import { Device } from '../types';
import DeviceControlWidget, { type WidgetDevice } from '../widgets/DeviceControl';

const DEVICE_KIND = 'device';

let pendingCatalog: AppIntentEntity[] | null = null;
let catalogWrite: Promise<void> | null = null;

function toWidgetDevice(device: Device): WidgetDevice | null {
  const id = device.id.trim();
  if (!id) {
    return null;
  }

  return {
    id,
    name: device.name.trim() || device.mac.trim() || 'Device',
    mac: device.mac,
    ip: device.ip,
    canSleep: device.sol_enabled,
    canShutdown: device.shutdown_cmd !== '',
    status: device.status || 'unknown',
  };
}

function toCatalogEntity(device: WidgetDevice): AppIntentEntity {
  const synonyms = [device.mac, device.ip].filter(value => {
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed !== device.name;
  });

  return {
    id: device.id,
    title: device.name,
    subtitle: device.mac.trim() || undefined,
    synonyms,
  };
}

function publishDeviceCatalog(entities: AppIntentEntity[]): void {
  if (!appIntentsAvailable()) {
    return;
  }

  pendingCatalog = entities;
  if (catalogWrite) {
    return;
  }

  catalogWrite = drainDeviceCatalog();
}

async function drainDeviceCatalog(): Promise<void> {
  while (pendingCatalog) {
    const next = pendingCatalog;
    pendingCatalog = null;
    try {
      await setEntityCatalogAsync(DEVICE_KIND, next);
    } catch (error) {
      console.warn('Could not publish the device catalog.', error);
      break;
    }
  }

  catalogWrite = null;
  if (pendingCatalog) {
    catalogWrite = drainDeviceCatalog();
  }
}

/**
 * Syncs device data to the iOS widget and Siri device catalog.
 * Called after the device list loads.
 */
export function syncDevicesToWidget(devices: Device[]): void {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    const widgetDevices = devices
      .map(toWidgetDevice)
      .filter((device): device is WidgetDevice => device !== null);

    DeviceControlWidget.setConfigurationParameterEnum(
      'device',
      widgetDevices.map(device => ({
        name: device.name,
        value: device.id,
        subtitle: device.mac.trim() || undefined,
      }))
    );
    DeviceControlWidget.updateSnapshot({ devices: widgetDevices });
    publishDeviceCatalog(widgetDevices.map(toCatalogEntity));
  } catch (error) {
    console.error('Failed to sync devices to widget:', error);
  }
}

/**
 * Refreshes widget timelines so they pick up the latest snapshot.
 */
export function refreshWidgets(): void {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    DeviceControlWidget.reload();
  } catch (error) {
    console.error('Failed to refresh widgets:', error);
  }
}
