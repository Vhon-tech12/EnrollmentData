import AppShell from '@/components/layout/AppShell';
import { RoleProvider } from '@/components/RoleProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <AppShell>{children}</AppShell>
    </RoleProvider>
  );
}