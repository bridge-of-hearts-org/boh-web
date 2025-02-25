import type { MetadataRoute } from "next";
import { fetchAllFacilities } from "./directory/data";
import { DirectoryFilterType } from "@/utils/defines";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://bridgeofhearts.lk";

    const filters: DirectoryFilterType = {
        name: "",
        city: "",
        district: "",
        province: "",
    };

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
    const facilitySitemap = facilities.map((facility) => ({
        url: `${baseUrl}/facility/${facility.slug}`,
        lastModified: new Date(),
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${baseUrl}/directory`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        ...facilitySitemap,
    ];
}
