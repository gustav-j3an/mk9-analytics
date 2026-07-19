import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  return <AppShell>{children}</AppShell>;
}
