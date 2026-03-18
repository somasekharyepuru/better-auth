"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  ChevronRight,
  Users,
  Settings,
  MoreHorizontal,
  Calendar,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: string;
  createdAt: Date;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // @ts-ignore
        const { data } = await authClient.organization.list();
        if (data) {
          setOrganizations(data);
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleCreateOrg = () => {
    router.push("/organizations/create");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organizations"
        description={
          organizations.length > 0
            ? `You are a member of ${organizations.length} organization${organizations.length > 1 ? "s" : ""}`
            : "Create or join an organization to get started"
        }
        backHref="/profile"
        actions={
          <Button onClick={handleCreateOrg}>
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        }
        className="animate-fade-in-up"
      />

      {/* Content */}
      {organizations.length === 0 ? (
        <Card
          variant="outline"
          className="border-dashed border-2 animate-fade-in-up delay-100"
        >
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 animate-float">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                No organizations yet
              </h3>
              <p className="text-muted-foreground mb-8">
                Organizations help you collaborate with your team, manage
                members, and organize your work.
              </p>
              <Button onClick={handleCreateOrg} size="lg" className="group">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
                <Sparkles className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 stagger-children">
          {organizations.map((org, index) => (
            <Card
              key={org.id}
              variant="interactive"
              className="group overflow-hidden animate-fade-in-up"
            >
              <div className="flex items-center">
                {/* Left accent bar */}
                <div className="w-1 self-stretch bg-transparent group-hover:bg-primary transition-colors duration-300" />

                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Org Icon */}
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                        {org.logo ? (
                          <img
                            src={org.logo}
                            alt={org.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
                        )}
                      </div>

                      {/* Org Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                            {org.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="text-xs font-mono"
                          >
                            {org.slug}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Created{" "}
                            {new Date(org.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden sm:inline-flex"
                      >
                        <Link href={`/organizations/${org.id}/members`}>
                          <Users className="mr-2 h-4 w-4" />
                          Members
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden sm:inline-flex"
                      >
                        <Link href={`/organizations/${org.id}/settings`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </Button>
                      <Button asChild className="group/btn">
                        <Link href={`/organizations/${org.id}`}>
                          Open
                          <ChevronRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="sm:hidden"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/organizations/${org.id}/members`}>
                              <Users className="mr-2 h-4 w-4" />
                              Members
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/organizations/${org.id}/settings`}>
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick tip section */}
      {organizations.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-xl border border-dashed text-center animate-fade-in delay-300">
          <p className="text-sm text-muted-foreground">
            <Lightbulb className="inline-block h-4 w-4 mr-1 text-amber-500" />{" "}
            <strong>Tip:</strong> Click on an organization to access its
            dashboard, manage members, and configure settings.
          </p>
        </div>
      )}
    </div>
  );
}
