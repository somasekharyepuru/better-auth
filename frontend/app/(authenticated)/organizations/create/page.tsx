"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string()
    .optional()
    .refine(
      (v) => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.toLowerCase()),
      "Slug must be lowercase alphanumeric and may include hyphens"
    ),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

export default function CreateOrganizationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "", slug: "" },
  });

  const onSubmit = async (data: CreateOrgForm) => {
    setIsLoading(true);
    try {
      const result = await authClient.organization.create({
        name: data.name,
        slug: data.slug || data.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
          .replace(/[^a-z0-9]+/g, "-")     // Replace non-alphanumeric with hyphen
          .replace(/^-+|-+$/g, "")         // Trim leading/trailing hyphens
          .replace(/-+/g, "-"),            // Collapse multiple hyphens
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to create organization");
        return;
      }

      toast.success("Organization created successfully");
      if (result.data?.id) {
        router.push(`/organizations/${result.data.id}`);
      } else {
        router.push("/organizations");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10">
      <div className="mb-6">
        <Link
          href="/organizations"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Link>
        <h1 className="text-3xl font-bold">Create Organization</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new organization to manage your team and projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Enter the name and optional slug for your new organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Acme Corp"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="acme-corp"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for your organization URL. If left empty,
                      one will be generated from the name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <LoadingButton
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  loadingText="Creating..."
                >
                  Create Organization
                </LoadingButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
