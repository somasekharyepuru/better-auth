import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchAPI } from '@/lib/auth-client';
import { RoleForm } from '../role-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewRolePage({ params }: PageProps) {
  const { id: organizationId } = await params;
  const cookieStore = await cookies();

  // Build cookie header for server-side fetch
  const sessionToken = cookieStore.get('better-auth.session_token')?.value;
  const cookieHeader = sessionToken ? `better-auth.session_token=${sessionToken}` : undefined;

  let organization: { name: string; slug: string } | null = null;
  try {
    const result = await fetchAPI<
      { name: string; slug: string } | { error?: string; message?: string } | null
    >(`/api/organizations/${organizationId}`, { cookies: cookieHeader });

    if (
      !result ||
      typeof result !== 'object' ||
      'error' in result ||
      'message' in result ||
      !('name' in result)
    ) {
      notFound();
    }

    organization = result;
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Custom Role</h1>
        <p className="text-muted-foreground">
          Define permissions for a new custom role in {organization.name}
        </p>
      </div>
      <RoleForm organizationId={organizationId} organizationName={organization.name} />
    </div>
  );
}
