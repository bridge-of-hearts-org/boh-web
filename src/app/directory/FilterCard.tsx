"use client";

import { useEffect, useState } from "react";
import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";

import Card from "@/components/Card";
import Button from "@/components/Button";
import AutocompleteInput from "@/components/AutocompleteInput";
import {
    defaultItemsPerPage,
    defaultSortBy,
    DirectoryFilterType,
    District,
    Province,
    ProvincesList,
    ProvinceToDistrict,
} from "@/utils/defines";

export default function FilterCard({
    names,
    cities,
    managedByOptions,
}: {
    names: string[];
    cities: string[];
    managedByOptions: string[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [sortOptions, setSortOptions] = useState({
        sortBy: searchParams.get("sortBy") || defaultSortBy,
        itemsPerPage: searchParams.get("itemsPerPage") || defaultItemsPerPage,
    });

    const [activeFilters, setActiveFilters] = useState<DirectoryFilterType>({
        name: searchParams.get("name") || "",
        city: searchParams.get("city") || "",
        managedBy: searchParams.get("managedBy") || "",
        district: (searchParams.get("district") || "") as District | "",
        province: (searchParams.get("province") || "") as Province | "",
    });

    const [cityInput, setCityInput] = useState(searchParams.get("city") || "");
    const [isApplying, setIsApplying] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        const city = searchParams.get("city") || "";
        setActiveFilters({
            name: searchParams.get("name") || "",
            city,
            managedBy: searchParams.get("managedBy") || "",
            district: (searchParams.get("district") || "") as District | "",
            province: (searchParams.get("province") || "") as Province | "",
        });
        setCityInput(city);

        setSortOptions({
            sortBy: searchParams.get("sortBy") || "",
            itemsPerPage: searchParams.get("itemsPerPage") || "",
        });
        setIsApplying(false);
        setIsResetting(false);
    }, [searchParams]);

    function handleFilterReset() {
        const hasActiveFilters =
            activeFilters.name ||
            activeFilters.city ||
            activeFilters.managedBy ||
            activeFilters.district ||
            activeFilters.province;

        if (hasActiveFilters) {
            setIsResetting(true);
        }

        setActiveFilters({
            name: "",
            city: "",
            managedBy: "",
            district: "",
            province: "",
        });

        setCityInput("");
        router.push("/directory");
    }

    function handleFilterSubmit(data: FormData) {
        const params = new URLSearchParams();
        params.set("name", data.get("name")?.toString() || "");
        params.set("city", data.get("city")?.toString() || "");
        params.set("managedBy", data.get("managedBy")?.toString() || "");
        params.set("district", data.get("district")?.toString() || "");
        params.set("province", data.get("province")?.toString() || "");
        params.set("sortBy", sortOptions.sortBy);
        params.set("itemsPerPage", sortOptions.itemsPerPage.toString());

        router.push(`/directory/?${params.toString()}`);
    }

    return (
        <Card className="h-auto w-full xl:w-full">
            <h1 className="pb-5 text-xl font-semibold">Filters</h1>
            <Form
                action={handleFilterSubmit}
                onSubmit={() => setIsApplying(true)}
                className="flex flex-col gap-5 py-3"
            >
                <div className="flex flex-col gap-2">
                    <label htmlFor="name">Name</label>
                    <AutocompleteInput
                        id="name"
                        name="name"
                        value={activeFilters.name}
                        options={names}
                        onChange={(name) =>
                            setActiveFilters({
                                ...activeFilters,
                                name,
                            })
                        }
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="city">City</label>
                    <AutocompleteInput
                        id="city"
                        name="city"
                        value={cityInput}
                        options={cities}
                        onChange={setCityInput}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="managedBy">Managed By</label>
                    <AutocompleteInput
                        id="managedBy"
                        name="managedBy"
                        value={activeFilters.managedBy}
                        options={managedByOptions}
                        onChange={(managedBy) =>
                            setActiveFilters({
                                ...activeFilters,
                                managedBy,
                            })
                        }
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="province">Province</label>
                    <select
                        id="province"
                        name="province"
                        value={activeFilters.province}
                        onChange={(e) => {
                            setActiveFilters({
                                ...activeFilters,
                                province: e.target.value as Province,
                            });
                        }}
                    >
                        <option value=""></option>
                        {ProvincesList.map((province) => {
                            return (
                                <option key={province} value={province}>
                                    {province}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="district"
                        className={
                            activeFilters.province
                                ? "text-boh-black"
                                : "text-gray-400"
                        }
                    >
                        District
                    </label>
                    <select
                        id="district"
                        name="district"
                        disabled={!activeFilters.province}
                        value={activeFilters.district}
                        onChange={(e) => {
                            setActiveFilters({
                                ...activeFilters,
                                district: e.target.value as District,
                            });
                        }}
                    >
                        <option value=""></option>
                        {activeFilters.province &&
                            ProvinceToDistrict[activeFilters.province].map(
                                (district) => {
                                    return (
                                        <option key={district} value={district}>
                                            {district}
                                        </option>
                                    );
                                },
                            )}
                    </select>
                </div>
                <div className="mt-8 flex justify-end gap-5">
                    <Button
                        name="Reset Filters"
                        variant="secondary"
                        type="button"
                        loading={isResetting}
                        loadingText="Resetting"
                        onClick={handleFilterReset}
                    >
                        Reset
                    </Button>
                    <Button
                        name="Apply Filters"
                        variant="primary"
                        type="submit"
                        loading={isApplying}
                        loadingText="Applying"
                    >
                        Apply
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
