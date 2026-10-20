import React from 'react';

export function DeviceContextMenu({
  children,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  return <>{children}</>;
}
