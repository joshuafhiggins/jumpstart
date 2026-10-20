import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import React from 'react';

export function DeviceContextMenu({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  return (
    <Host>
      <ContextMenu>
        <ContextMenu.Items>
          <Button
            systemImage="trash"
            role="destructive"
            label="Delete Device"
            onPress={onDelete}
          />
        </ContextMenu.Items>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}
