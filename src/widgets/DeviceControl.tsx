import { HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { SFSymbol } from 'sf-symbols-typescript';

export type WidgetDevice = {
  id: string;
  name: string;
  mac: string;
  ip: string;
  canSleep: boolean;
  canShutdown: boolean;
  status: string;
};

type DeviceControlProps = {
  devices: WidgetDevice[];
};

type DeviceControlConfiguration = {
  device?: string | null;
};

type DeviceAction = {
  id: 'wake' | 'sleep' | 'restart' | 'shutdown';
  symbol: SFSymbol;
  color: string;
  enabled: boolean;
};

const DeviceControlWidgetView = (
  props: DeviceControlProps,
  environment: WidgetEnvironment<DeviceControlConfiguration>
) => {
  'widget';
  const rootModifiers = [
    containerBackground({ type: 'hierarchical', style: 'quaternary' }, 'widget'),
    padding({ top: 4, bottom: 4 }),
  ];
  const devices = Array.isArray(props.devices) ? props.devices : [];
  const selectedId = environment.configuration?.device;
  const device = devices.find(candidate => candidate.id === selectedId);

  if (!device || !selectedId || selectedId === 'none') {
    return (
      <VStack
        spacing={8}
        modifiers={[...rootModifiers, frame({ maxWidth: 10000, maxHeight: 10000 })]}
      >
        <Image systemName="desktopcomputer" size={32} color="#8E8E93" />
        <Text
          modifiers={[
            font({ size: 14, weight: 'medium' }),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
          ]}
        >
          Select a Device
        </Text>
        <Text
          modifiers={[
            font({ size: 11 }),
            foregroundStyle({ type: 'hierarchical', style: 'tertiary' }),
          ]}
        >
          Long press to configure
        </Text>
      </VStack>
    );
  }

  const isOnline = device.status === 'online';
  const isOffline = device.status === 'offline';
  const actions: DeviceAction[] = [
    { id: 'wake', symbol: 'bolt.fill', color: '#4CAF50', enabled: isOffline },
    {
      id: 'sleep',
      symbol: 'moon.fill',
      color: '#FF9800',
      enabled: isOnline && Boolean(device.canSleep),
    },
    {
      id: 'restart',
      symbol: 'arrow.clockwise',
      color: '#2196F3',
      enabled: isOnline && Boolean(device.canShutdown),
    },
    {
      id: 'shutdown',
      symbol: 'power',
      color: '#F44336',
      enabled: isOnline && Boolean(device.canShutdown),
    },
  ];

  const buttons = actions.map(action => {
    const tint = action.enabled ? action.color : '#8E8E93';
    const button = (
      <VStack
        alignment="center"
        modifiers={[
          frame({ maxWidth: 10000, minHeight: 36 }),
          background(`${tint}26`, shapes.roundedRectangle({ cornerRadius: 8 })),
        ]}
      >
        <Image systemName={action.symbol} size={16} color={tint} />
      </VStack>
    );

    if (!action.enabled) {
      return <VStack key={action.id}>{button}</VStack>;
    }

    return (
      <Link
        key={action.id}
        destination={`remotewol-upsnap://action/${action.id}/${encodeURIComponent(device.id)}`}
      >
        {button}
      </Link>
    );
  });

  const header = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({ size: 15, weight: 'semibold' }), lineLimit(1)]}>{device.name}</Text>
      <Text
        modifiers={[
          font({ size: 11 }),
          foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
          lineLimit(1),
        ]}
      >
        {device.mac}
      </Text>
    </VStack>
  );

  if (environment.widgetFamily === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={8} modifiers={rootModifiers}>
        {header}
        <Spacer minLength={4} />
        <VStack spacing={6}>
          <HStack spacing={6}>
            {buttons[0]}
            {buttons[1]}
          </HStack>
          <HStack spacing={6}>
            {buttons[2]}
            {buttons[3]}
          </HStack>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={8} modifiers={rootModifiers}>
      {header}
      <Spacer minLength={4} />
      <HStack spacing={8}>{buttons}</HStack>
    </VStack>
  );
};

const DeviceControlWidget = createWidget<DeviceControlProps, DeviceControlConfiguration>(
  'DeviceControl',
  DeviceControlWidgetView,
  { devices: [] }
);

export default DeviceControlWidget;
