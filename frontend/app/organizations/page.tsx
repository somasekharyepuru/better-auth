'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const session = await authClient.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const orgsResult = await authClient.organization.list();
        if (orgsResult.data) {
          setOrganizations(Array.isArray(orgsResult.data) ? orgsResult.data : []);
        }
      } catch (err) {
        setError('Failed to load organizations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [router]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading organizations...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Organizations</h1>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/dashboard">Back to Dashboard</Link>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {organizations.length === 0 ? (
        <div>
          <p>No organizations found.</p>
          <p>Note: Organization creation is restricted to admins in this single-org model.</p>
        </div>
      ) : (
        <div>
          {organizations.map((org) => (
            <div
              key={org.id}
              style={{
                border: '1px solid #ccc',
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '4px',
              }}
            >
              <h2>{org.name}</h2>
              <p>Slug: {org.slug}</p>
              <p>Created: {new Date(org.createdAt).toLocaleDateString()}</p>
              <Link href={`/organizations/${org.id}`}>View Details</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

