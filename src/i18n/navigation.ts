import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/* Locale-aware replacements for next/link and next/navigation. Use these on
   public pages so links keep the current language. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
