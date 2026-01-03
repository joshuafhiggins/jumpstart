import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/services/api';
import { Device } from '../../src/types';

export default function DeviceDetailsScreen() {
  const router = useRouter();
  const { id: deviceId } = useLocalSearchParams<{ id: string }>();
  
  const [device, setDevice] = useState<Device | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mac: '',
    ip: '',
    netmask: '',
    broadcast: '',
    secureOnPassword: '',
    port: '',
  });

  useEffect(() => {
    loadDevice();
  }, [deviceId]);

  const loadDevice = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDevice(deviceId);
      setDevice(data);
      setFormData({
        name: data.name,
        mac: data.mac,
        ip: data.ip,
        netmask: data.netmask || '',
        broadcast: data.broadcast || '',
        secureOnPassword: data.secureOnPassword || '',
        port: String(data.port),
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load device');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.mac || !formData.ip) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateDevice(deviceId, {
        name: formData.name,
        mac: formData.mac,
        ip: formData.ip,
        netmask: formData.netmask,
        broadcast: formData.broadcast,
        secureOnPassword: formData.secureOnPassword,
        port: parseInt(formData.port) || 9,
      });
      setIsEditing(false);
      await loadDevice();
      Alert.alert('Success', 'Device updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update device');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Device',
      'Are you sure you want to delete this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteDevice(deviceId);
              Alert.alert('Success', 'Device deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete device');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {isEditing ? (
          <View style={styles.form}>
            <Text style={styles.label}>Device Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Device name"
            />

            <Text style={styles.label}>MAC Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.mac}
              onChangeText={(text) => setFormData({ ...formData, mac: text })}
              placeholder="00:11:22:33:44:55"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>IP Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.ip}
              onChangeText={(text) => setFormData({ ...formData, ip: text })}
              placeholder="192.168.1.100"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Netmask</Text>
            <TextInput
              style={styles.input}
              value={formData.netmask}
              onChangeText={(text) => setFormData({ ...formData, netmask: text })}
              placeholder="255.255.255.0"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Broadcast Address</Text>
            <TextInput
              style={styles.input}
              value={formData.broadcast}
              onChangeText={(text) => setFormData({ ...formData, broadcast: text })}
              placeholder="192.168.1.255"
              keyboardType="numeric"
            />

            <Text style={styles.label}>SecureOn Password</Text>
            <TextInput
              style={styles.input}
              value={formData.secureOnPassword}
              onChangeText={(text) => setFormData({ ...formData, secureOnPassword: text })}
              placeholder="Optional password"
            />

            <Text style={styles.label}>Port</Text>
            <TextInput
              style={styles.input}
              value={formData.port}
              onChangeText={(text) => setFormData({ ...formData, port: text })}
              placeholder="9"
              keyboardType="numeric"
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Text style={styles.buttonText}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setFormData({
                    name: device!.name,
                    mac: device!.mac,
                    ip: device!.ip,
                    netmask: device!.netmask || '',
                    broadcast: device!.broadcast || '',
                    secureOnPassword: device!.secureOnPassword || '',
                    port: String(device!.port),
                  });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{device?.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MAC Address</Text>
              <Text style={styles.detailValue}>{device?.mac}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IP Address</Text>
              <Text style={styles.detailValue}>{device?.ip}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Netmask</Text>
              <Text style={styles.detailValue}>{device?.netmask || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Broadcast</Text>
              <Text style={styles.detailValue}>{device?.broadcast || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Port</Text>
              <Text style={styles.detailValue}>{device?.port}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{device?.status}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Groups</Text>
              <Text style={styles.detailValue}>
                {device?.groups?.join(', ') || 'None'}
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  form: {
    gap: 15,
  },
  details: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  detailRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
