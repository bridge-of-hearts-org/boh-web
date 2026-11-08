import { redirect } from "next/navigation";

import { getServerAuth } from "@/lib/auth";
import EditForm from "../EditForm";

export default async function AddNewFacility() {
    /* Make sure that the user is logged in as admin */
    const session = await getServerAuth();
    if (!session) {
        const currentPath = `/facility/new`;
        redirect(`/admin/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }

    return (
        <article>
            <EditForm newFacility={true} />
        </article>
    );
}
