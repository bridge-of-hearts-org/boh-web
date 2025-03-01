"use client";

import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";

import Card from "@/components/Card";
import { useEffect, useState } from "react";

type SortingBarProps = {
    page: number;
    itemsPerPage: number;
    totalCount: number;
};

export default function SortingBar(props: SortingBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "name");

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
        const currentSortBy = searchParams.get("sortBy") || "name";
        const newPage = currentSortBy === sortBy ? currentPage : "1";

        params.set("sortBy", sortBy);
        params.set("page", newPage);
        router.push(`/directory/?${params.toString()}`);
    }, [sortBy]);

    useEffect(() => {
        setSortBy(searchParams.get("sortBy") || "name");
    }, [searchParams]);

    return (
        <Card>
            <div className="flex items-center justify-between px-2">
                <div>
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
                        </div>
                    </Form>
                </div>
            </div>
        </Card>
    );
}
