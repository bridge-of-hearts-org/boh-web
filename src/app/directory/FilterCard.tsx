"use client";

import { useEffect, useState } from "react";
import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";

import Card from "@/components/Card";
import Button from "@/components/Button";
import {
    DirectoryFilterType,
    District,
    Province,
    ProvincesList,
    ProvinceToDistrict,
} from "@/utils/defines";

export default function FilterCard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeFilters, setActiveFilters] = useState<DirectoryFilterType>({
        name: searchParams.get("name") || "",
        city: searchParams.get("city") || "",
        managedBy: searchParams.get("managedBy") || "",
        district: (searchParams.get("district") || "") as District | "",
        province: (searchParams.get("province") || "") as Province | "",
    });

    useEffect(() => {
        setActiveFilters({
            name: searchParams.get("name") || "",
            city: searchParams.get("city") || "",
            managedBy: searchParams.get("managedBy") || "",
            district: (searchParams.get("district") || "") as District | "",
            province: (searchParams.get("province") || "") as Province | "",
        });
    }, [searchParams]);

    function handleFilterSubmit(data: FormData) {
        const params = new URLSearchParams();
        params.set("name", data.get("name")?.toString() || "");
        params.set("city", data.get("city")?.toString() || "");
        params.set("managedBy", data.get("managedBy")?.toString() || "");
        params.set("district", data.get("district")?.toString() || "");
        params.set("province", data.get("province")?.toString() || "");

        router.push(`/directory/?${params.toString()}`);
    }

    return (
        <Card className="h-auto w-full xl:w-full">
            <h1 className="pb-5 text-xl font-semibold">Filters</h1>
            <Form
                action={handleFilterSubmit}
                onReset={() => {
                    router.push("/directory");
                }}
                className="flex flex-col gap-5 py-3"
            >
                <div className="flex flex-col gap-2">
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        defaultValue={activeFilters.name}
                    ></input>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="city">City</label>
                    <input
                        id="city"
                        name="city"
                        type="text"
                        defaultValue={activeFilters.city}
                    ></input>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="managedBy">Managed By</label>
                    <input
                        id="managedBy"
                        name="managedBy"
                        type="text"
                        defaultValue={activeFilters.managedBy}
                    ></input>
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
                        type="reset"
                        onClick={() => {
                            setActiveFilters({
                                name: "",
                                city: "",
                                managedBy: "",
                                district: "",
                                province: "",
                            });
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        name="Apply Filters"
                        variant="primary"
                        type="submit"
                    >
                        Apply
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
