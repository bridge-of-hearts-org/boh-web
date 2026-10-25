import { defaultItemsPerPage, maxItemsPerPage } from "@/utils/defines";

/* Parse a page number from a URL param or action argument: a whole number, at least 1 */
export function parsePage(value: unknown): number {
    const page = Math.floor(Number(value));

    if (!Number.isFinite(page) || page < 1) {
        return 1;
    }

    return page;
}

/* Parse a page size: a whole number from 1 to maxItemsPerPage, otherwise the default */
export function parseItemsPerPage(value: unknown): number {
    const itemsPerPage = Math.floor(Number(value));

    if (!Number.isFinite(itemsPerPage) || itemsPerPage < 1) {
        return defaultItemsPerPage;
    }

    return Math.min(itemsPerPage, maxItemsPerPage);
}
