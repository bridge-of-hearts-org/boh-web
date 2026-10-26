import { defaultItemsPerPage, maxItemsPerPage } from "@/utils/defines";

/* Far past the last page of any real result, but keeps the database skip value small */
const maxPage = 1_000_000;

/* Parse a page number from a URL param or action argument: a whole number from 1 to maxPage */
export function parsePage(value: unknown): number {
    const page = Math.floor(Number(value));

    if (!Number.isFinite(page) || page < 1) {
        return 1;
    }

    return Math.min(page, maxPage);
}

/* Parse a page size: a whole number from 1 to maxItemsPerPage, otherwise the default */
export function parseItemsPerPage(value: unknown): number {
    const itemsPerPage = Math.floor(Number(value));

    if (!Number.isFinite(itemsPerPage) || itemsPerPage < 1) {
        return defaultItemsPerPage;
    }

    return Math.min(itemsPerPage, maxItemsPerPage);
}

/* The last page for a result count, at least 1 so an empty result still has a page */
export function lastPage(totalCount: number, itemsPerPage: number): number {
    return Math.max(1, Math.ceil(totalCount / itemsPerPage));
}
