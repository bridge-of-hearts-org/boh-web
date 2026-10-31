/* Site navigation entries, shared by the header bar and the mobile menu */

export type MenuItem = {
    label: string;
    href: string;
    /* The item's key in the "Nav" messages. The English-only Admin item has
       none and always shows its label. */
    messageKey?: "home" | "directory" | "about" | "contact";
};

export const adminMenuItem: MenuItem = {
    label: "Admin",
    href: "/admin",
};

export const mainMenuItems: MenuItem[] = [
    { label: "Home", href: "/", messageKey: "home" },
    { label: "Directory", href: "/directory", messageKey: "directory" },
    { label: "About", href: "/about", messageKey: "about" },
    { label: "Contact", href: "/contact", messageKey: "contact" },
];

/* Items for the hamburger menu on small screens. The header's Admin
   button is hidden at those widths, so the menu carries it instead, at the
   top, while an admin is logged in. */
export function getMobileMenuItems(inAdminSession: boolean): MenuItem[] {
    if (inAdminSession) {
        return [adminMenuItem, ...mainMenuItems];
    }

    return [...mainMenuItems];
}

/* Admin page for editing the facility with the given slug */
export function facilityEditPath(slug: string): string {
    return `/facility/edit/${slug}`;
}

/* A path with an optional query string, e.g. ("/directory", "page=2") gives
   "/directory?page=2" */
export function pathWithSearch(pathname: string, search: string): string {
    if (!search) {
        return pathname;
    }

    return `${pathname}?${search}`;
}
