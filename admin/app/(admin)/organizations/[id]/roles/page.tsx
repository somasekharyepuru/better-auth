'use client';

import { useParams } from 'next/navigation';
import { RolesClient } from './roles-client';
import { useOrganization } from '@/lib/hooks/use-organization';
import { AlertCircle } from 'lucide-react';

export default function OrganizationRolesPage() {
  const params = useParams<{ id: string }>();
  const organizationId = params.id;
  const { organization, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <RolesClient
        organizationId={organizationId}
        organizationName="Loading organization..."
      />
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Unable to load organization details.
        </p>
      </div>
    );
  }

  return <RolesClient organizationId={organizationId} organizationName={organization.name} />;
}
