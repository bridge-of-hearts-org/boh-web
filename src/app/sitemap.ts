import type { MetadataRoute } from "next";
import { fetchAllFacilities } from "./actions/data";
import { DirectoryFilterType, emptyFilter } from "@/utils/defines";
import { localizedSitemapEntries } from "@/utils/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://bridgeofhearts.lk";

    const filters: DirectoryFilterType = emptyFilter;

    const [facilities, totalCount] = await fetchAllFacilities(
        filters,
        "name",
        1, // Page
        1000, // Items per page (Get all the items)
    );

    if (totalCount > 1000) {
        console.log(
            "Warning: Not all facilities have been fetched for the sitemap generation",
        );
    }

    /* Generate the sitemap for the facility pages */
    const facilitySitemap = facilities.flatMap((facility) =>
        localizedSitemapEntries(baseUrl, `/facility/${facility.slug}`, {
            lastModified: new Date(),
        }),
    );

    return [
        ...localizedSitemapEntries(baseUrl, "/", {
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        }),
        ...localizedSitemapEntries(baseUrl, "/directory", {
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        }),
        ...localizedSitemapEntries(baseUrl, "/about", {
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        }),
        ...localizedSitemapEntries(baseUrl, "/contact", {
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        }),
        ...facilitySitemap,
    ];
}
