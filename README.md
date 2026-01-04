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
- An UpSnap server instance running

### Installation

1. Install dependencies:
```bash
npm i
```

2. Start the development server:
```bash
npx expo run
```

3. Run on your preferred platform:
   - iOS: Press `i` in the terminal or run `npx expo run:ios`
   - Android: Press `a` in the terminal or run `npx expo run:android`

## Usage

### First Time Setup

1. Open the app
2. Enter your UpSnap server credentials:
   - Server Address
   - Username or Email
   - Password
3. Tap "Login"

### Device Management

#### Adding a Device

1. Tap the "Scan" button in the Devices screen
2. Wait for the network scan to complete
3. Tap on a discovered device to add it to your list

#### Managing Devices

- **View Devices**: Scroll through the list on the main screen
- **Wake Device**: Tap the green "Wake" button on a device card
- **Sleep Device**: Tap the orange "Sleep" button
- **Reboot Device**: Tap the blue "Reboot" button
- **Shutdown Device**: Tap the red "Shutdown" button

### Status Indicators

- 🟢 Green dot: Device is online
- 🔴 Red dot: Device is offline
- 🟠 Orange dot: Status unknown

## Security Notes

- Never expose your UpSnap server to the open web without proper security measures

## Troubleshooting

### Login Issues

- Verify your username/email and password are correct
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

This project is licensed under the MIT License.

## Credits

- UpSnap: https://github.com/seriousm4x/UpSnap
- Built with React Native and Expo
