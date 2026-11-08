import { notFound } from "next/navigation";

/* Unknown paths render [locale]/not-found.tsx inside the site layout. This
   sits outside (pages) so loading.tsx doesn't stream a 200 status first. */
export default function CatchAll() {
    notFound();
}
