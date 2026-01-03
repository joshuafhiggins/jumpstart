import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import api from '../src/services/api';

export default function AddDeviceScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mac: '',
    ip: '',
    netmask: '255.255.255.0',
    broadcast: '',
    secureOnPassword: '',
    port: '9',
  });

   const handleSave = async () => {
     if (!formData.name || !formData.mac || !formData.ip) {
       Alert.alert('Error', 'Please fill in all required fields');
       return;
     }

     setIsLoading(true);
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
       router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add device');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Add New Device</Text>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="My PC"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>MAC Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.mac}
              onChangeText={(text) => setFormData({ ...formData, mac: text })}
              placeholder="00:11:22:33:44:55"
              autoCapitalize="characters"
            />
            <Text style={styles.hint}>
              Format: XX:XX:XX:XX:XX:XX
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IP Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.ip}
              onChangeText={(text) => setFormData({ ...formData, ip: text })}
              placeholder="192.168.1.100"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Netmask</Text>
            <TextInput
              style={styles.input}
              value={formData.netmask}
              onChangeText={(text) => setFormData({ ...formData, netmask: text })}
              placeholder="255.255.255.0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Broadcast Address</Text>
            <TextInput
              style={styles.input}
              value={formData.broadcast}
              onChangeText={(text) => setFormData({ ...formData, broadcast: text })}
              placeholder="192.168.1.255"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>
              Optional: Auto-calculated if left blank
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SecureOn Password</Text>
            <TextInput
              style={styles.input}
              value={formData.secureOnPassword}
              onChangeText={(text) => setFormData({ ...formData, secureOnPassword: text })}
              placeholder="Optional password"
              secureTextEntry
            />
            <Text style={styles.hint}>
              Optional: For SecureOn enabled NICs
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Port</Text>
            <TextInput
              style={styles.input}
              value={formData.port}
              onChangeText={(text) => setFormData({ ...formData, port: text })}
              placeholder="9"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>
              Default: 9 (Standard Wake-on-LAN port)
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Adding...' : 'Add Device'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
