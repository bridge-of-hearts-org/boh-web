"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Button from "@/components/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Form from "next/form";

type NavigationProps = {
    totalPages: number;
};

export default function NavigationBar(props: NavigationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentPage: number = Number(searchParams.get("page")) || 1;

    const handleClick = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());

        router.push(`/directory/?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-9">
            {currentPage > 1 && (
                <Button
                    name={`Go to the previous page`}
                    variant="secondary"
                    color="black"
                    className="bg-white shadow-md"
                    onClick={() => handleClick(currentPage - 1)}
                >
                    <ChevronLeft />
                </Button>
            )}
            <div className="flex items-center gap-3">
                <span>Page</span>
                <Form action={() => {}}>
                    <div className="flex items-center gap-5 text-sm">
                        <select
                            name="sortBy"
                            value={currentPage}
                            className="border-gray-200 bg-white"
                            onChange={(e) => {
                                handleClick(Number(e.target.value));
                            }}
                        >
                            {Array.from(
                                { length: props.totalPages },
                                (_, i) => (
                                    <option key={i} value={i + 1}>
                                        {i + 1}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </Form>
                <span>
                    of <span className="font-bold">{props.totalPages}</span>
                </span>
            </div>
            {currentPage < props.totalPages && (
                <Button
                    name={`Go to next page`}
                    variant="secondary"
                    color="black"
                    className="bg-white shadow-md"
                    onClick={() => handleClick(currentPage + 1)}
                >
                    <ChevronRight />
                </Button>
            )}
        </div>
    );
}
