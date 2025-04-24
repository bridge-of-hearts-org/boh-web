import FilterCard from "./FilterCard";
import { District, Province } from "@/utils/defines";
import { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FacilityCards, FacilityCardsSkeleton } from "./FacilityCards";
import { Suspense } from "react";

const itemsPerPage = 10;

export const metadata: Metadata = {
    title: "Directory | Bridge of Hearts",
    description:
        "Browse a list of Child Development Centers (Children's Homes) in Sri Lanka. Filter by name, city, district, and province",
};

export default async function DirectoryPage(props: {
    searchParams: Promise<{
        name?: string;
        city?: string;
        managedBy?: string;
        district?: District | "";
        province?: Province | "";
        sortBy?: string;
        page: number;
    }>;
}) {
    const searchParams = await props.searchParams;
    const currentPage = searchParams.page || 1;

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-gradient-to-r from-white/10 via-orange-100/50 to-white/10 py-10">
                <h1 className="text-center font-encode-sans-sc text-xl font-bold">
                    Child Development Centers
                </h1>
                <h2 className="mb-3 text-center text-sm font-semibold">
                    Find information about Children's Homes across Sri Lanka
                </h2>
            </div>
            <div>
                <Breadcrumbs
                    hierarchy={[
                        {
                            text: "Home",
                            link: "/",
                        },
                        {
                            text: "Directory",
                            link: "/directory",
                        },
                    ]}
                />
            </div>
            <div className="flex flex-col items-center gap-5 xl:grid xl:grid-cols-[400px,1fr] xl:items-start">
                {/* Filter Card */}
                <FilterCard />
                <Suspense fallback={<FacilityCardsSkeleton />}>
                    <FacilityCards
                        name={searchParams.name || ""}
                        city={searchParams.city || ""}
                        managedBy={searchParams.managedBy || ""}
                        district={(searchParams.district as District) || ""}
                        province={(searchParams.province as Province) || ""}
                        page={currentPage}
                        sortBy={searchParams.sortBy || "name"}
                    />
                </Suspense>
            </div>
        </div>
    );
}
