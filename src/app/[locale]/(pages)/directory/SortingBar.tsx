"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { Loader } from "lucide-react";

import Card from "@/components/Card";
import { defaultSortBy } from "@/utils/defines";
import { parsePage } from "@/utils/pagination";

type SortingBarProps = {
    page: number;
    itemsPerPage: number;
    totalCount: number;
};

export default function SortingBar(props: SortingBarProps) {
    const t = useTranslations("Sorting");
    /* Sorting by name is hard to follow in Sinhala, where few people know
       the full alphabetical order, so Sinhala pages keep the default sort */
    const showSort = useLocale() !== "si";
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const sortBy = searchParams.get("sortBy") || defaultSortBy;
    const itemsPerPage = props.itemsPerPage;

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
        const currentPage = String(parsePage(searchParams.get("page")));
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
                    {t.rich(numPages > 1 ? "showing" : "total", {
                        start: displayStart,
                        end: displayEnd,
                        total: props.totalCount,
                        b: (chunks) => (
                            <span className="font-semibold">{chunks}</span>
                        ),
                    })}
                </div>
                {/* Each label stays with its dropdown, and the pairs wrap
                    onto separate lines when the labels are too long to fit */}
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm">
                    {isPending && (
                        <Loader className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {showSort && (
                        <div className="flex items-center gap-3">
                            <label htmlFor="sortBy">{t("sortBy")}</label>
                            <select
                                id="sortBy"
                                name="sortBy"
                                value={sortBy}
                                disabled={isPending}
                                onChange={(e) =>
                                    navigate(e.target.value, itemsPerPage)
                                }
                            >
                                <option value="name">{t("name")}</option>
                                <option value="city">{t("city")}</option>
                            </select>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <label htmlFor="itemsPerPage">
                            {t("itemsPerPage")}
                        </label>
                        <select
                            id="itemsPerPage"
                            name="itemsPerPage"
                            value={itemsPerPage}
                            disabled={isPending}
                            onChange={(e) =>
                                navigate(sortBy, Number(e.target.value))
                            }
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
