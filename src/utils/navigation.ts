/* Site navigation entries, shared by the header bar and the mobile menu */

export type MenuItem = {
    label: string;
    href: string;
};

export const adminMenuItem: MenuItem = {
    label: "Admin Session",
    href: "/admin",
};

export const mainMenuItems: MenuItem[] = [
    { label: "Home", href: "/" },
    { label: "Directory", href: "/directory" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
];

/* Items for the hamburger menu on small screens. The header's Admin Session
   button is hidden at those widths, so the menu carries it instead while an
   admin is logged in. */
export function getMobileMenuItems(inAdminSession: boolean): MenuItem[] {
    if (inAdminSession) {
        return [...mainMenuItems, adminMenuItem];
    }

    return [...mainMenuItems];
}

/* Admin page for editing the facility with the given slug */
export function facilityEditPath(slug: string): string {
    return `/facility/edit/${slug}`;
}
