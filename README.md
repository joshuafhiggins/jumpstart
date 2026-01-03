# UpSnap Mobile

A React Native Expo app that connects to an UpSnap server and provides mobile access to all Wake-on-LAN features.

## Features

- 🔌 **Device Management**: View, add, edit, and delete devices
- 💤 **Power Control**: Wake, sleep, reboot, and shutdown devices remotely
- 🔍 **Network Scanning**: Discover devices on your local network
- 👤 **Authentication**: Secure login with username/email and password
- 📱 **Mobile-First UI**: Touch-optimized interface designed for phones
- 🎨 **Clean Design**: Modern, intuitive interface with visual status indicators

## Setup

### Prerequisites

- Node.js installed
- Expo CLI installed (`npm install -g expo-cli`)
- An UpSnap server instance running (e.g., https://wol.f6knight.duckdns.org/)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
   - iOS: Press `i` in the terminal or run `npm run ios`
   - Android: Press `a` in the terminal or run `npm run android`
   - Web: Press `w` in the terminal or run `npm run web`

## Usage

### First Time Setup

1. Open the app
2. Enter your UpSnap server credentials:
   - Username or Email
   - Password
   - Check "Login as Admin" if you're an admin user
3. Tap "Login"

### Device Management

#### Adding a Device

1. Tap the "+ Add" button in the Devices screen
2. Fill in the required fields:
   - Device Name (e.g., "My PC")
   - MAC Address (format: XX:XX:XX:XX:XX:XX)
   - IP Address
   - Optional: Netmask, Broadcast Address, SecureOn Password, Port
3. Tap "Add Device"

#### Scanning for Devices

1. Tap the "Scan" button in the Devices screen
2. Wait for the network scan to complete
3. Tap on a discovered device to add it to your list

#### Managing Devices

- **View Devices**: Scroll through the list on the main screen
- **Device Details**: Tap on a device card to view and edit details
- **Wake Device**: Tap the green "Wake" button on a device card
- **Sleep Device**: Tap the orange "Sleep" button
- **Reboot Device**: Tap the blue "Reboot" button
- **Shutdown Device**: Tap the red "Shutdown" button

### Status Indicators

- 🟢 Green dot: Device is online
- 🔴 Red dot: Device is offline
- 🟠 Orange dot: Status unknown

## Screens

### Login Screen
- Username/email and password fields
- Admin login option
- Persistent authentication using AsyncStorage

### Devices Screen
- List of all devices with status indicators
- Quick action buttons for each device
- Pull-to-refresh for updating status
- Add device and scan network buttons

### Device Details Screen
- View all device information
- Edit device details
- Delete device option

### Add Device Screen
- Manual device entry form
- All required and optional fields
- Input validation

### Scan Devices Screen
- Network scanning functionality
- List of discovered devices
- Quick add to device list

### Settings Screen
- User information display
- Server configuration
- Logout option
- Clear data option

## API Integration

The app connects to an UpSnap server via its REST API:

- **Authentication**: `/api/collections/users/auth-with-password` or `/api/collections/_superusers/auth-with-password`
- **Devices**: `/api/collections/devices/records`
- **Wake**: `/api/upsnap/wake/:id`
- **Sleep**: `/api/collections/upsnap/sleep/:id`
- **Reboot**: `/api/upsnap/reboot/:id`
- **Shutdown**: `/api/upsnap/shutdown/:id`
- **Scan**: `/api/upsnap/scan`

## Project Structure

```
src/
├── components/       # Reusable components
├── context/          # React context providers (AuthContext)
├── navigation/       # Navigation setup
├── screens/          # All app screens
│   ├── LoginScreen.tsx
│   ├── DeviceListScreen.tsx
│   ├── DeviceDetailsScreen.tsx
│   ├── AddDeviceScreen.tsx
│   ├── ScanDevicesScreen.tsx
│   └── SettingsScreen.tsx
├── services/         # API service
│   └── api.ts
└── types/            # TypeScript type definitions
    └── index.ts
```

## Tech Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform
- **TypeScript**: Type safety
- **React Navigation**: Navigation library
- **AsyncStorage**: Local data persistence

## Server Configuration

The app is pre-configured to connect to:
- Server URL: `https://wol.f6knight.duckdns.org`
- API Base: `/api`

To change the server URL, modify the `API_BASE_URL` constant in `src/services/api.ts`.

## Security Notes

- Authentication tokens are stored securely in AsyncStorage
- All API calls require authentication
- Destructive actions (sleep, reboot, shutdown) require confirmation
- Never expose your UpSnap server to the open web without proper security measures

## Troubleshooting

### Login Issues

- Verify your username/email and password are correct
- Check if you need to log in as admin
- Ensure your UpSnap server is accessible

### Network Scan Issues

- Network scanning requires the server to have `nmap` installed
- Scanning may take several minutes to complete
- Make sure your device and server are on the same network

### Device Control Issues

- Verify the device's MAC address is correct
- Ensure Wake-on-LAN is enabled in the device's BIOS/UEFI
- Check that the device is on the same network as the server
- For sleep/shutdown/reboot, ensure the device has the required agent installed

## License

This project is a mobile companion to UpSnap, which is licensed under the MIT License.

## Credits

- UpSnap: https://github.com/seriousm4x/UpSnap
- Built with React Native and Expo
