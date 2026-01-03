import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/services/api';
import { NetworkScanResult } from '../src/types';

export default function ScanDevicesScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<NetworkScanResult[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<NetworkScanResult | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mac: '',
    ip: '',
    netmask: '255.255.255.0',
    broadcast: '',
    secureOnPassword: '',
    port: '9',
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      const results = await api.scanNetwork();
      setDevices(results);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to scan network');
    } finally {
      setScanning(false);
    }
  };

  const handleAddFromScan = (device: NetworkScanResult) => {
    const deviceName = device.name || device.hostname || `Device ${device.ip || device.ip_address}`;
    const deviceIP = device.ip || device.ip_address || '';
    const deviceMAC = device.mac || device.mac_address || '';
    const deviceVendor = device.mac_vendor || '';
    
    setFormData({
      name: deviceName,
      mac: deviceMAC,
      ip: deviceIP,
      netmask: '255.255.255.0',
      broadcast: '',
      secureOnPassword: '',
      port: '9',
    });
    setSelectedDevice(device);
    setShowAddModal(true);
  };

  const handleSaveDevice = async () => {
    if (!formData.name || !formData.mac || !formData.ip) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await api.createDevice({
        name: formData.name,
        mac: formData.mac,
        ip: formData.ip,
        netmask: formData.netmask,
        broadcast: formData.broadcast,
        secureOnPassword: formData.secureOnPassword,
        port: parseInt(formData.port) || 9,
        groups: [],
        status: 'offline',
      });
      Alert.alert('Success', 'Device added successfully');
      setShowAddModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add device');
    }
  };

  const renderDevice = ({ item }: { item: NetworkScanResult }) => {
    const displayName = item.name || item.hostname || 'Unknown Device';
    const displayIP = item.ip || item.ip_address || '';
    const displayMAC = item.mac || item.mac_address || '';
    const displayVendor = item.mac_vendor || '';
    
    return (
      <TouchableOpacity
        style={styles.deviceCard}
        onPress={() => handleAddFromScan(item)}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.deviceDetail}>{displayIP}</Text>
          <Text style={styles.deviceDetail}>{displayMAC}</Text>
          {displayVendor && displayVendor !== 'Unknown' && (
            <Text style={styles.vendorText}>{displayVendor}</Text>
          )}
        </View>
        <View style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Network Scan</Text>
        <Text style={styles.headerSubtext}>
          Discover devices on your local network
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
        onPress={handleScan}
        disabled={scanning}
      >
        {scanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.scanButtonText}>Scan Network</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.infoText}>
        Note: This requires the server to have nmap installed and may take several minutes.
      </Text>

      {devices.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>Discovered Devices ({devices.length})</Text>
          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={(item, index) => `${item.ip || item.ip_address || index}-${index}`}
            contentContainerStyle={styles.list}
          />
        </View>
      )}

      {devices.length === 0 && !scanning && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tap "Scan Network" to discover devices</Text>
        </View>
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Device</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Device Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Device name"
                />
                {selectedDevice?.mac_vendor && (
                  <Text style={styles.hint}>
                    Vendor: {selectedDevice.mac_vendor}
                  </Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>MAC Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mac}
                  onChangeText={(text) => setFormData({ ...formData, mac: text })}
                  placeholder="00:11:22:33:44:55"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>IP Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.ip}
                  onChangeText={(text) => setFormData({ ...formData, ip: text })}
                  placeholder="192.168.1.100"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Netmask</Text>
                <TextInput
                  style={styles.input}
                  value={formData.netmask}
                  onChangeText={(text) => setFormData({ ...formData, netmask: text })}
                  placeholder="255.255.255.0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Broadcast Address</Text>
                <TextInput
                  style={styles.input}
                  value={formData.broadcast}
                  onChangeText={(text) => setFormData({ ...formData, broadcast: text })}
                  placeholder="192.168.1.255"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Port</Text>
                <TextInput
                  style={styles.input}
                  value={formData.port}
                  onChangeText={(text) => setFormData({ ...formData, port: text })}
                  placeholder="9"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveDevice}
              >
                <Text style={styles.saveButtonText}>Add Device</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#666',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  scanButtonDisabled: {
    backgroundColor: '#ccc',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  list: {
    gap: 10,
  },
  deviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deviceDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  vendorText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalBlur: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
