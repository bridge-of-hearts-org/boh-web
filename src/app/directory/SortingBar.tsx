"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";

import Card from "@/components/Card";
import { defaultSortBy, defaultItemsPerPage } from "@/utils/defines";

type SortingBarProps = {
    page: number;
    itemsPerPage: number;
    totalCount: number;
};

export default function SortingBar(props: SortingBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const sortBy = searchParams.get("sortBy") || defaultSortBy;
    const itemsPerPage = Number(searchParams.get("itemsPerPage")) || props.itemsPerPage;

    /* Calculate start and end item indices in the page */
    const displayStart = (props.page - 1) * props.itemsPerPage + 1;
    const displayEnd = Math.min(
        displayStart + props.itemsPerPage - 1,
        props.totalCount,
    );
    const numPages = Math.ceil(props.totalCount / props.itemsPerPage);

    function navigate(newSortBy: string, newItemsPerPage: number) {
        const params = new URLSearchParams(searchParams);
        const currentSortBy = searchParams.get("sortBy") || defaultSortBy;
        const currentPage = searchParams.get("page") || "1";
        const newPage = currentSortBy === newSortBy ? currentPage : "1";

        params.set("sortBy", newSortBy);
        params.set("page", newPage);
        params.set("itemsPerPage", String(newItemsPerPage));
        startTransition(() => {
            router.push(`/directory/?${params.toString()}`);
        });
    }

    return (
        <Card>
            <div className="flex flex-wrap items-center justify-center text-nowrap px-2 md:justify-between">
                <div className="pb-5 md:pb-0">
                    {numPages > 1 && (
                        <span>
                            {`Showing ${displayStart} - ${displayEnd} of `}
                        </span>
                    )}
                    <span className="font-semibold">{`${props.totalCount} `}</span>
                    <span>{`${props.totalCount == 1 ? "facility" : "facilities"}`}</span>
                </div>
                <div>
                    <div className="flex items-center gap-5 text-sm">
                        {isPending && (
                            <Loader className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        <label htmlFor="sortBy">Sort By</label>
                        <select
                            name="sortBy"
                            value={sortBy}
                            disabled={isPending}
                            onChange={(e) => navigate(e.target.value, itemsPerPage)}
                        >
                            <option value="name">Name</option>
                            <option value="city">City</option>
                        </select>
                        <label htmlFor="itemsPerPage">Items Per Page</label>
                        <select
                            name="itemsPerPage"
                            value={itemsPerPage}
                            disabled={isPending}
                            onChange={(e) => navigate(sortBy, Number(e.target.value))}
                        >
                            {[5, 10, 20, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </Card>
    );
}
