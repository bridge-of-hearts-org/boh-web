"use client";

import { useEffect, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import Card from "@/components/Card";
import Button from "@/components/Button";
import { District, Province } from "@/utils/types";

type FilterType = {
    name: string;
    district: District | "";
    province: Province | "";
};

export default function FilterCard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [filters, setFilters] = useState<FilterType>({
        name: searchParams.get("name") || "",
        district: searchParams.get("district") as District | "",
        province: searchParams.get("province") as Province | "",
    });

    useEffect(() => {
        setFilters({
            name: searchParams.get("name") || "",
            district: searchParams.get("district") as District | "",
            province: searchParams.get("province") as Province | "",
        });
    }, [searchParams]);

    function handleFilterSubmit(data: FormData) {
        const params = new URLSearchParams();

        params.set("name", data.get("name")?.toString() || "");
        params.set("district", data.get("district")?.toString() || "");
        params.set("province", data.get("province")?.toString() || "");

        router.push(`/directory/?${params.toString()}`);
    }

    return (
        <Card className="h-auto">
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
                        name="name"
                        type="text"
                        defaultValue={filters.name}
                    ></input>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="district">District</label>
                    <input
                        name="district"
                        type="text"
                        defaultValue={filters.district}
                    ></input>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="province">Province</label>
                    <input
                        name="province"
                        type="text"
                        defaultValue={filters.province}
                    ></input>
                </div>
                <div className="mt-8 flex justify-end gap-5">
                    <Button variant="secondary" type="reset">
                        Reset
                    </Button>
                    <Button variant="primary" type="submit">
                        Apply
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
