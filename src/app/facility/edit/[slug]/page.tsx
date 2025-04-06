import { redirect } from "next/navigation";
import { MapPin, PhoneCall } from "lucide-react";

import NotFound from "@/app/not-found";
import { getServerAuth } from "@/lib/auth";
import { fetchFacilityBySlug } from "@/app/directory/data";
import EditForm from "./EditForm";
import { ChildCareFacility } from "@prisma/client";

type FacilityPageProps = { params: Promise<{ slug: string }> };

export default async function FacilityEditPage({ params }: FacilityPageProps) {
    if (!params) {
        throw new Error("Missing params for FacilityProfilePage.");
    }

    /* NextJS requirement: params should be awaited before accessing 
            https://nextjs.org/docs/messages/sync-dynamic-apis*/
    const { slug } = await params;

    /* Make sure that the user is logged in as admin */
    const session = await getServerAuth();
    if (!session) {
        const currentPath = `/facility/edit/${slug}`;
        redirect(`/admin/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }

    let data = await fetchFacilityBySlug(slug);

    if (!data) {
        return NotFound();
    }

    return (
        <article>
            <EditForm data={data} />
        </article>
    );
}
