"use client"

import { useParams } from "next/navigation"
import { RolesClient } from "./roles-client"
import { useOrganizationDetail } from "@/hooks/use-organization-queries"
import { Loader2 } from "lucide-react"

export default function OrganizationRolesPage() {
    const params = useParams<{ id: string }>()
    const { data: organization, isLoading } = useOrganizationDetail(params.id)

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <RolesClient
            organizationId={params.id}
            organizationName={organization?.name || ""}
        />
    )
}
