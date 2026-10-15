import AppShell from '@/components/layout/AppShell';
import { RoleProvider } from '@/components/RoleProvider';

export default function RegistrarLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <AppShell>{children}</AppShell>
    </RoleProvider>
  );
}