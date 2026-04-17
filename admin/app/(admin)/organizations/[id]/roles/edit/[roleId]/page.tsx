import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { fetchAPI } from '@/lib/auth-client';
import { RoleForm } from '../../role-form';

interface PageProps {
  params: Promise<{ id: string; roleId: string }>;
}

export default async function EditRolePage({ params }: PageProps) {
  const { id: organizationId, roleId } = await params;
  const cookieStore = await cookies();

  // Build cookie header for server-side fetch
  const sessionToken = cookieStore.get('better-auth.session_token')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  const cookieHeader = `better-auth.session_token=${sessionToken}`;

  const [organization, role] = await Promise.all([
    fetchAPI<{ name: string; slug: string }>(
      `/api/organizations/${organizationId}`,
      { cookies: cookieHeader }
    ),
    fetchAPI<{ id: string; role: string; permission: Record<string, string[]> }>(
      `/api/organizations/${organizationId}/roles/${roleId}`,
      { cookies: cookieHeader }
    ),
  ]);

  if (!organization || !role) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Role: {role.role}</h1>
        <p className="text-muted-foreground">
          Modify permissions for {role.role} in {organization.name}
        </p>
      </div>
      <RoleForm
        organizationId={organizationId}
        organizationName={organization.name}
        existingRole={role}
      />
    </div>
  );
}
