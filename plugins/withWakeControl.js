const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MARKER = 'jumpstart-wake-control';

/**
 * Adds the Control Center wake control to the extension expo-widgets generates.
 * This plugin must be listed before expo-widgets so it runs after that extension is written.
 */
function withWakeControl(config) {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const indexPath = path.join(
        config.modRequest.platformProjectRoot,
        'ExpoWidgetsTarget',
        'index.swift'
      );

      if (!fs.existsSync(indexPath)) {
        throw new Error(
          'expo-widgets has not generated ios/ExpoWidgetsTarget/index.swift yet. List ./plugins/withWakeControl before expo-widgets in the plugins array.'
        );
      }

      const source = fs.readFileSync(indexPath, 'utf8');
      if (source.includes(MARKER)) {
        return config;
      }

      if (!source.includes('WidgetLiveActivity()')) {
        throw new Error(
          'Could not find WidgetLiveActivity() in ios/ExpoWidgetsTarget/index.swift.'
        );
      }

      const controlPath = path.join(
        config.modRequest.projectRoot,
        'plugins',
        'WakeDeviceControl.swift'
      );
      const controlSource = fs.readFileSync(controlPath, 'utf8');
      let next = source;

      if (!next.includes('import AppIntents')) {
        next = next.replace('import SwiftUI\n', 'import SwiftUI\nimport AppIntents\n');
      }

      next = next.replace(
        /^([ \t]*)WidgetLiveActivity\(\)/m,
        `$1if #available(iOS 18.0, *) {\n$1  WakeDeviceControl()\n$1}\n$1WidgetLiveActivity()`
      );
      next = `${next.trimEnd()}\n\n${controlSource.trim()}\n`;
      fs.writeFileSync(indexPath, next);
      return config;
    },
  ]);
}

module.exports = withWakeControl;
