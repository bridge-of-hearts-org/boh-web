import Form from "next/form";
import { MapPin, PhoneCall } from "lucide-react";

import { fetchFacilityBySlug } from "@/app/directory/data";
import NotFound from "@/app/not-found";
import Card from "@/components/Card";
import { DistrictsList, ProvincesList } from "@/utils/defines";

type FacilityPageProps = { params: Promise<{ slug: string }> };

export default async function FacilityEditPage({ params }: FacilityPageProps) {
    if (!params) {
        throw new Error("Missing params for FacilityProfilePage.");
    }

    /* NextJS requirement: params should be awaited before accessing 
            https://nextjs.org/docs/messages/sync-dynamic-apis*/
    // const { slug } = await params;
    // const data = await fetchFacilityBySlug(slug);

    const data = {
        location: {
            address: "612/6, Mabola, Wattala",
            city: "Wattala",
            province: "Western",
            district: "Gampaha",
            divisionalSecretariat: "Wattala",
            google: "https://maps.app.goo.gl/sHa8oNbhamJtEAPdA",
            latitude: null,
            longitude: null,
        },
        contact: {
            phone: ["0112931876"],
            email: [],
            website: "",
            facebook: "",
            instagram: "",
        },
        occupancy: { total: 20, male: null, female: null },
        ageRanges: { all: "8 - 18", male: "", female: "" },
        photos: [
            {
                fileName: "1da3e69727d086e4.jpeg",
                source: "https://www.globalsistersreport.org/files/2025-02/3.jpg",
            },
        ],
        id: "67c4d6e428e77cc59f9c1f12",
        name: "Children of Joy Home Child Development Center",
        slug: "children-of-joy-childrens-home-wattala",
        type: "Voluntary Children's Home",
        managedBy: "Good Shepherd Sisters Congregation",
        genders: "female",
        sources: [
            "https://probation.wp.gov.lk/en/?page_id=545",
            "https://www.globalsistersreport.org/qas/qa-sr-princy-fernandopulle-working-child-care-families-communities",
        ],
    };

    if (!data) {
        return NotFound();
    }

    const inputRowStyle =
        "w-full grid grid-cols-[1fr,3fr] gap-3 items-center grow";
    const sectionStyle = "flex flex-col items-center gap-5 pt-5";
    const sectionHeaderStyles =
        "flex items-center justify-start gap-2 pl-5 md:text-xl text-lg";

    return (
        <article>
            <Card className="flex w-full flex-col items-center gap-8 p-10">
                {/* Title */}
                <section className="flex flex-col items-center">
                    <div>
                        <h1 className="text-center text-2xl font-semibold">
                            Edit Facility
                        </h1>
                    </div>
                </section>
                <Form
                    action={""}
                    className="divde flex w-full flex-col gap-10 divide-y"
                >
                    {/* Basic Info */}
                    <section className="flex flex-col items-center gap-5">
                        <div className={inputRowStyle}>
                            <label>Name</label>
                            <input className="grow" value={data.name}></input>
                        </div>
                        <div className={inputRowStyle}>
                            <label>Type</label>
                            <select className="grow" value={data.type}>
                                <option value="Voluntary Children's Home">
                                    Voluntary Children's Home
                                </option>
                                <option value="Government Facility">
                                    Government Facility
                                </option>
                            </select>
                        </div>
                        <div className={inputRowStyle}>
                            <label>Managed By</label>
                            <input
                                className="grow"
                                value={data.managedBy}
                            ></input>
                        </div>
                        <div className={inputRowStyle}>
                            <label>Description</label>
                            <textarea className="grow" value={""}></textarea>
                        </div>
                    </section>

                    {/* Location */}
                    <section className={sectionStyle}>
                        {/* Header */}
                        <div className={sectionHeaderStyles}>
                            <MapPin />
                            <h2 className="font-semibold">Location</h2>
                        </div>

                        <div className={inputRowStyle}>
                            <label>Address</label>
                            <input
                                className="grow"
                                value={data.location.address}
                            ></input>
                        </div>

                        <div className={inputRowStyle}>
                            <label>City</label>
                            <input
                                className="grow"
                                value={data.location.city}
                            ></input>
                        </div>

                        <div className={inputRowStyle}>
                            <label>Divisional Secretariat</label>
                            <input
                                className="grow"
                                value={data.location.divisionalSecretariat}
                            ></input>
                        </div>

                        <div className={inputRowStyle}>
                            <label>District</label>
                            <select
                                className="grow"
                                value={data.location.district}
                            >
                                {DistrictsList.map((district) => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={inputRowStyle}>
                            <label>Province</label>
                            <select
                                className="grow"
                                value={data.location.province}
                            >
                                {ProvincesList.map((province) => (
                                    <option key={province} value={province}>
                                        {province}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={inputRowStyle}>
                            <label>Google Maps</label>
                            <input
                                className="grow"
                                value={data.location.google}
                            ></input>
                        </div>
                    </section>

                    {/* Contact Info */}
                    <section className={sectionStyle}>
                        <div className={sectionHeaderStyles}>
                            <PhoneCall />
                            <h2 className="font-semibold">Contact</h2>
                        </div>
                    </section>
                </Form>
            </Card>
        </article>
    );
}
