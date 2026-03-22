"use client";

import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";

import Card from "@/components/Card";
import { useEffect, useState } from "react";
import { defaultSortBy } from "@/utils/defines";

type SortingBarProps = {
    page: number;
    itemsPerPage: number;
    totalCount: number;
};

export default function SortingBar(props: SortingBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [sortBy, setSortBy] = useState(
        searchParams.get("sortBy") || defaultSortBy,
    );

    const [itemsPerPage, setItemsPerPage] = useState(
        Number(searchParams.get("itemsPerPage")) || props.itemsPerPage,
    );

    /* Calculate start and end item indices in the page */
    const displayStart = (props.page - 1) * props.itemsPerPage + 1;
    const displayEnd = Math.min(
        displayStart + props.itemsPerPage - 1,
        props.totalCount,
    );
    const numPages = Math.ceil(props.totalCount / props.itemsPerPage);

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const currentPage = searchParams.get("page") || "1";
        const currentSortBy = searchParams.get("sortBy") || defaultSortBy;
        const newPage = currentSortBy === sortBy ? currentPage : "1";

        params.set("sortBy", sortBy);
        params.set("page", newPage);
        params.set("itemsPerPage", String(itemsPerPage));
        router.push(`/directory/?${params.toString()}`);
    }, [sortBy, itemsPerPage]);

    useEffect(() => {
        setSortBy(searchParams.get("sortBy") || defaultSortBy);
        setItemsPerPage(
            Number(searchParams.get("itemsPerPage")) || props.itemsPerPage,
        );
    }, [searchParams]);

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
                    <Form action={() => {}}>
                        <div className="flex items-center gap-5 text-sm">
                            <label htmlFor="sortBy">Sort By</label>
                            <select
                                name="sortBy"
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                }}
                            >
                                <option value="name">Name</option>
                                <option value="city">City</option>
                            </select>
                            <label htmlFor="itemsPerPage">Items Per Page</label>
                            <select
                                name="itemsPerPage"
                                value={itemsPerPage}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setItemsPerPage(val);
                                }}
                            >
                                {[5, 10, 20, 50].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Form>
                </div>
            </div>
        </Card>
    );
}
