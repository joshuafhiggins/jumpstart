import { CommonActions, useNavigation } from '@react-navigation/native';
import * as Burnt from 'burnt';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import api from '../../../src/services/api';

type DeviceAction = 'wake' | 'sleep' | 'restart' | 'shutdown';

export default function ActionHandler() {
  const params = useLocalSearchParams<{ action: string; deviceId: string }>();
  const navigation = useNavigation();
  const hasExecuted = useRef(false);

  const { action, deviceId } = params;

  useEffect(() => {
    // Fire action once
    if (!hasExecuted.current && action && deviceId) {
      hasExecuted.current = true;
      executeAction(action as DeviceAction, deviceId);
    }

    // Reset navigation to tabs - clears entire stack so no back button
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: '(tabs)' }],
      })
    );
  }, [action, deviceId, navigation]);

  // Show nothing while redirecting
  return <Redirect href={"/"} />;
}

async function executeAction(
  action: DeviceAction,
  deviceId: string
): Promise<void> {
  // Get device name for toast
  let deviceName = 'device';
  try {
    const device = await api.getDevice(deviceId);
    deviceName = device.name;
  } catch (error) {
    console.warn('Could not fetch device name:', error);
  }

  // Show sending toast
  const sendingMessages: Record<DeviceAction, string> = {
    wake: `Sending wake command to ${deviceName}...`,
    sleep: `Sending sleep command to ${deviceName}...`,
    restart: `Sending restart command to ${deviceName}...`,
    shutdown: `Sending shutdown command to ${deviceName}...`,
  };

  Burnt.toast({
    title: sendingMessages[action],
    preset: 'none',
  });

  // Execute the action
  try {
    switch (action) {
      case 'wake':
        await api.wakeDevice(deviceId);
        Burnt.toast({
          title: 'Success',
          preset: 'done',
          message: `Waking ${deviceName} up.`,
        });
        break;

      case 'sleep':
        await api.sleepDevice(deviceId);
        Burnt.toast({
          title: 'Success',
          preset: 'done',
          message: `Sending ${deviceName} to sleep.`,
        });
        break;

      case 'restart':
        await api.rebootDevice(deviceId);
        Burnt.toast({
          title: 'Success',
          preset: 'done',
          message: `Rebooting ${deviceName}.`,
        });
        break;

      case 'shutdown':
        await api.shutdownDevice(deviceId);
        Burnt.toast({
          title: 'Success',
          preset: 'done',
          message: `Shutting down ${deviceName}.`,
        });
        break;
    }
  } catch (error: any) {
    Burnt.toast({
      title: 'Error',
      preset: 'error',
      message: error.message || `Failed to ${action} ${deviceName}.`,
    });
  }
}
