import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import { Ionicons } from '@expo/vector-icons';
import * as Burnt from 'burnt';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import api from '../../../src/services/api';
import { syncDevicesToWidget } from '../../../src/services/widgetSync';
import { Device } from '../../../src/types';
import { useAuth } from '@/src/context/AuthContext';

const isAuthError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'isAuthError' in error &&
  (error as { isAuthError?: boolean }).isAuthError === true;

export default function DeviceListScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#0b0b0d' : '#f5f5f5';
  const cardBg = isDark ? '#1c1c1e' : '#fff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const subTextColor = isDark ? '#c6c6c8' : '#666666';
  const activityColor = isDark ? '#0A84FF' : '#007AFF';

  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isAuthenticated } = useAuth();

  const fetchDevices = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await api.getDevices();
      setDevices(data);
      // Sync devices to iOS widget
      syncDevicesToWidget(data);
    } catch (error: any) {
      if (isAuthError(error)) {
        setDevices([]);
        return;
      }

      // For background/periodic refreshes, avoid interruptive alerts
      if (showLoading) {
        Alert.alert('Error', error.message || 'Failed to load devices');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchDevices(true);
  }, [fetchDevices, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let intervalId: number | null = null;

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        fetchDevices(false);
      }, 10000) as unknown as number;
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Start polling while app is active; pause when backgrounded
    startPolling();

    const onAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [fetchDevices, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices(false);
    setRefreshing(false);
  };

  const handleWake = async (device: Device) => {
    try {
      await api.wakeDevice(device.id);
      Burnt.toast({
        title: 'Success',
        preset: 'done',
        message: `Waking ${device.name} up.`,
      });
    } catch (error: any) {
      Burnt.toast({
        title: 'Error',
        preset: 'error',
        message: error.message || `Failed to wake up ${device.name}.`,
      });
    }
  };

  const handleSleep = async (device: Device) => {
    Alert.alert('Confirm', `Send ${device.name} to sleep?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sleep',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.sleepDevice(device.id);
            Burnt.toast({
              title: 'Success',
              preset: 'done',
              message: `Sending ${device.name} to sleep.`,
            });
          } catch (error: any) {
            Burnt.toast({
              title: 'Error',
              preset: 'error',
              message:
                error.message || `Failed to send ${device.name} to sleep.`,
            });
          }
        },
      },
    ]);
  };

  const handleReboot = async (device: Device) => {
    Alert.alert('Confirm', `Reboot ${device.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reboot',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.rebootDevice(device.id);
            Burnt.toast({
              title: 'Success',
              preset: 'done',
              message: `Rebooting ${device.name}.`,
            });
          } catch (error: any) {
            Burnt.toast({
              title: 'Error',
              preset: 'error',
              message: error.message || `Failed to reboot ${device.name}`,
            });
          }
        },
      },
    ]);
  };

  const handleShutdown = async (device: Device) => {
    Alert.alert(
      'Confirm Shutdown',
      `Shutdown ${device.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Shutdown',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.shutdownDevice(device.id);
              Burnt.toast({
                title: 'Success',
                preset: 'done',
                message: `Shutting down ${device.name}.`,
              });
            } catch (error: any) {
              Burnt.toast({
                title: 'Error',
                preset: 'error',
                message: error.message || `Failed to shut down ${device.name}.`,
              });
            }
          },
        },
      ]
    );
  };

  const handleDelete = (device: Device) => {
    Alert.alert('Delete Device', `Delete "${device.name}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          // Close alert
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteDevice(device.id);
            Burnt.toast({
              title: 'Success',
              preset: 'done',
              message: `Deleted ${device.name} successfully.`,
            });
            fetchDevices(false);
          } catch (error: any) {
            Burnt.toast({
              title: 'Error',
              preset: 'error',
              message: error.message || `Failed to delete ${device.name}.`,
            });
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return '#4CAF50';
      case 'offline':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const ActionIcon = ({
    name,
    symbolName,
    color,
    onPress,
    enabled,
    fallbackName,
  }: {
    name: string;
    symbolName: string;
    color: string;
    onPress: () => void;
    enabled: boolean;
    fallbackName?: string;
  }) => (
    <TouchableOpacity
      style={styles.actionIconContainer}
      onPress={onPress}
      disabled={!enabled}
      accessibilityLabel={name}
      activeOpacity={0.75}
    >
      <SymbolView
        name={symbolName as any}
        size={20}
        tintColor={color}
        type="monochrome"
        fallback={
          <Ionicons
            name={(fallbackName || 'ellipse') as any}
            size={20}
            color={color}
          />
        }
        style={styles.actionIcon}
      />
    </TouchableOpacity>
  );

  const renderDevice = ({ item }: { item: Device }) => {
    const isOnline = item.status?.toLowerCase() === 'online';
    const isOffline = item.status?.toLowerCase() === 'offline';
    
    return (
      <Host>
        <ContextMenu>
          <ContextMenu.Items>
            <Button
              systemImage="trash"
              role="destructive"
              label="Delete Device"
              onPress={() => handleDelete(item)}
            />
          </ContextMenu.Items>
          <ContextMenu.Trigger>
            <View
              style={[
                styles.deviceCard,
                {
                  backgroundColor: cardBg,
                  shadowColor: isDark ? 'rgba(0,0,0,0.6)' : '#000',
                },
              ]}
            >
              <View style={styles.deviceHeader}>
                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceName, { color: textColor }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.deviceIP, { color: subTextColor }]}>
                    {item.mac}
                  </Text>
                </View>
                <SymbolView
                  name="circle.fill"
                  size={18}
                  tintColor={getStatusColor(item.status)}
                  animationSpec={{
                    effect: { type: 'pulse' },
                    repeating: true,
                    speed: 1,
                  }}
                  fallback={
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(item.status) },
                      ]}
                    />
                  }
                  style={[
                    styles.statusSymbol,
                    {
                      shadowColor: getStatusColor(item.status),
                      shadowOpacity: isDark ? 0.9 : 0.6,
                    },
                  ]}
                />
              </View>

              <View style={styles.deviceActions}>
                <ActionIcon
                  name="Wake"
                  enabled={isOffline}
                  symbolName="bolt.circle.fill"
                  fallbackName="flash"
                  color={isOffline ? '#4CAF50' : subTextColor}
                  onPress={() => handleWake(item)}
                />
                <ActionIcon
                  name="Sleep"
                  enabled={isOnline && item.sol_enabled}
                  symbolName="moon.circle.fill"
                  fallbackName="moon"
                  color={isOnline && item.sol_enabled ? '#FF9800' : subTextColor}
                  onPress={() => handleSleep(item)}
                />
                <ActionIcon
                  name="Reboot"
                  enabled={isOnline && item.shutdown_cmd !== "" }
                  symbolName="arrow.clockwise.circle.fill"
                  fallbackName="refresh"
                  color={isOnline && item.shutdown_cmd !== "" ? '#2196F3' : subTextColor}
                  onPress={() => handleReboot(item)}
                />
                <ActionIcon
                  name="Shutdown"
                  enabled={isOnline && item.shutdown_cmd !== "" }
                  symbolName="power.circle.fill"
                  fallbackName="power"
                  color={isOnline && item.shutdown_cmd !== "" ? '#f44336' : subTextColor}
                  onPress={() => handleShutdown(item)}
                />
              </View>
            </View>
          </ContextMenu.Trigger>
        </ContextMenu>
      </Host>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={activityColor} />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: bgColor }]}
      data={devices}
      renderItem={renderDevice}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDark ? subTextColor : undefined}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No devices found
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 15,
    gap: 15,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    paddingRight: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deviceIP: {
    fontSize: 14,
    color: '#666',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    paddingBottom: 6,
  },
  actionIconContainer: {
    padding: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  actionIcon: {
    width: 22,
    height: 22,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  wakeButton: {
    backgroundColor: '#4CAF50',
  },
  sleepButton: {
    backgroundColor: '#FF9800',
  },
  rebootButton: {
    backgroundColor: '#2196F3',
  },
  shutdownButton: {
    backgroundColor: '#f44336',
  },
  statusSymbol: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
