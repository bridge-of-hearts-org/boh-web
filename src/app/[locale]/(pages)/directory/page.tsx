import FilterCard from "./FilterCard";
import { District, Province } from "@/utils/defines";
import { effectiveSortBy, Locale } from "@/utils/locale";
import { parseItemsPerPage, parsePage } from "@/utils/pagination";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FacilityCards, FacilityCardsSkeleton } from "./FacilityCards";
import { Suspense } from "react";
import {
    fetchDistinctCities,
    fetchDistinctManagedBy,
    fetchFacilityNames,
} from "@/app/actions/data";

export async function generateMetadata(props: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: "Directory" });

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
    };
}

export default async function DirectoryPage(props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        name?: string;
        city?: string;
        managedBy?: string;
        district?: District | "";
        province?: Province | "";
        sortBy?: string;
        page?: string;
        itemsPerPage?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: "Directory" });
    const tNav = await getTranslations({ locale, namespace: "Nav" });
    const currentPage = parsePage(searchParams.page);
    const [names, cities, managedByOptions] = await Promise.all([
        fetchFacilityNames(locale),
        fetchDistinctCities(locale),
        fetchDistinctManagedBy(locale),
    ]);

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-gradient-to-r from-white/10 via-orange-100/50 to-white/10 py-10">
                <h1 className="text-center font-encode-sans-sc text-xl font-bold">
                    {t("heading")}
                </h1>
                <h2 className="mb-3 text-center text-sm font-semibold">
                    {t("subheading")}
                </h2>
            </div>
            <div>
                <Breadcrumbs
                    hierarchy={[
                        {
                            text: tNav("home"),
                            link: "/",
                        },
                        {
                            text: tNav("directory"),
                            link: "/directory",
                        },
                    ]}
                />
            </div>
            <div className="flex flex-col items-center gap-5 xl:grid xl:grid-cols-[400px,1fr] xl:items-start">
                {/* Filter Card */}
                <FilterCard
                    names={names}
                    cities={cities}
                    managedByOptions={managedByOptions}
                />
                <Suspense fallback={<FacilityCardsSkeleton />}>
                    <FacilityCards
                        name={searchParams.name || ""}
                        city={searchParams.city || ""}
                        managedBy={searchParams.managedBy || ""}
                        district={(searchParams.district as District) || ""}
                        province={(searchParams.province as Province) || ""}
                        page={currentPage}
                        sortBy={effectiveSortBy(
                            locale as Locale,
                            searchParams.sortBy,
                        )}
                        itemsPerPage={parseItemsPerPage(
                            searchParams.itemsPerPage,
                        )}
                    />
                </Suspense>
            </div>
        </div>
    );
}
