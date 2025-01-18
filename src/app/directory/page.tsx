import Card from "@/components/Card";
import { MapPin, Phone } from "lucide-react";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { ChildCareFacility, PrismaClient } from "@prisma/client";

import { prisma } from "@/utils/db";
import Button from "@/components/Button";

const fetchData = async (): Promise<ChildCareFacility[]> => {
    try {
        const facilities = await prisma.childCareFacility.findMany();
        return facilities;
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error: ", error.stack);
        }
        return [];
    }
};

export default async function DirectoryPage() {
    const facilities = await fetchData();

    return (
        <div className="flex min-w-[400px] flex-col gap-5 lg:grid lg:grid-cols-[400px,1fr] lg:items-start">
            {/* Filter Card */}
            <Card className="h-auto">
                <h1 className="pb-5 text-xl font-semibold">Filters</h1>
                <Form action="" className="flex flex-col gap-5 py-3">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name">Name</label>
                        <input name="name"></input>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="province">Province</label>
                        <input name="province" type=""></input>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="district">District</label>
                        <input name="district" type=""></input>
                    </div>
                    <div className="mt-8 flex justify-end gap-5">
                        <Link href="/directory">
                            <Button variant="secondary">Clear All</Button>
                        </Link>
                        <Link href="/directory">
                            <Button variant="primary">Apply</Button>
                        </Link>
                    </div>
                </Form>
            </Card>
            <div className="flex min-w-[400px] flex-col gap-5 rounded-2xl">
                {facilities.map((facility) => {
                    return (
                        <Link
                            key={facility.id}
                            href={`/facility/${facility.id}`}
                        >
                            <Card>
                                <div className="flex gap-4">
                                    {facility.photos.length > 0 && (
                                        <div className="relative block h-[180px] w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                                            <Image
                                                src={facility.photos[0]}
                                                alt="facility-icon"
                                                fill
                                            />
                                        </div>
                                    )}
                                    {facility.photos.length == 0 && (
                                        <div className="relative block h-[180px] w-[180px] flex-shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                                            <Image
                                                src="/images/facility-directory-icon-default.png"
                                                alt="facility-icon"
                                                fill
                                                className="p-8"
                                            />
                                        </div>
                                    )}
                                    <div className="flex w-full flex-col gap-5">
                                        {/* Title section */}
                                        <div>
                                            <div className="text-lg font-semibold">
                                                {facility.name}
                                            </div>
                                            <div className="text-sm">
                                                {facility.type}
                                            </div>
                                        </div>

                                        {/* Address and contact section */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <div>
                                                    <MapPin size={"1rem"} />
                                                </div>
                                                <div>
                                                    {facility.location.address}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <div>
                                                    <Phone size={"1rem"} />
                                                </div>
                                                <div>
                                                    {facility.contact.phone.join(
                                                        ", ",
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Region section */}
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 text-sm">
                                                {facility.location.district}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                {facility.location.province}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
