"use client";

import { useState } from "react";
import Form from "next/form";
import Card from "@/components/Card";
import { ChildCareFacility } from "@prisma/client";
import { DistrictsList, ProvincesList } from "@/utils/defines";
import { MapPin, PhoneCall } from "lucide-react";
import Button from "@/components/Button";

type EditFormProps = {
    data: ChildCareFacility;
};

export default function EditForm(props: EditFormProps) {
    const [formData, setFormData] = useState<ChildCareFacility>(props.data);

    const inputRowStyle =
        "w-full grid grid-cols-[1fr,3fr] gap-3 items-center grow";
    const sectionStyle = "flex flex-col items-center gap-5 pt-5";
    const sectionHeaderStyles =
        "flex items-center justify-start gap-2 pl-5 md:text-xl text-lg";

    return (
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
                        <input
                            className="grow"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                        ></input>
                    </div>
                    <div className={inputRowStyle}>
                        <label>Type</label>
                        <select
                            className="grow"
                            value={formData.type}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    type: e.target.value,
                                })
                            }
                        >
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
                            value={formData.managedBy}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    managedBy: e.target.value,
                                })
                            }
                        ></input>
                    </div>
                    <div className={inputRowStyle}>
                        <label>Description</label>
                        <textarea
                            className="grow"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                        ></textarea>
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
                            value={formData.location.address}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    location: {
                                        ...formData.location,
                                        address: e.target.value,
                                    },
                                })
                            }
                        ></input>
                    </div>

                    <div className={inputRowStyle}>
                        <label>City</label>
                        <input
                            value={formData.location.city}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    location: {
                                        ...formData.location,
                                        city: e.target.value,
                                    },
                                })
                            }
                            className="grow"
                        ></input>
                    </div>

                    <div className={inputRowStyle}>
                        <label>Divisional Secretariat</label>
                        <input
                            value={formData.location.divisionalSecretariat}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    location: {
                                        ...formData.location,
                                        divisionalSecretariat: e.target.value,
                                    },
                                })
                            }
                            className="grow"
                        ></input>
                    </div>

                    <div className={inputRowStyle}>
                        <label>District</label>
                        <select
                            className="grow"
                            value={formData.location.district}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    location: {
                                        ...formData.location,
                                        district: e.target.value,
                                    },
                                })
                            }
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
                            value={formData.location.province}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    location: {
                                        ...formData.location,
                                        province: e.target.value,
                                    },
                                })
                            }
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
                            value={formData.location.google}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    location: {
                                        ...formData.location,
                                        google: e.target.value,
                                    },
                                })
                            }
                        ></input>
                    </div>
                </section>

                {/* Contact Info */}
                <section className={sectionStyle}>
                    <div className={sectionHeaderStyles}>
                        <PhoneCall />
                        <h2 className="font-semibold">Contact</h2>
                    </div>

                    {/* <div className={inputRowStyle}>
                        <label>Phone</label>
                        <input
                            className="grow"
                            value={formData.contact.phone}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    contact: {
                                        ...formData.contact,
                                        phone: e.target.value,
                                    },
                                })
                            }
                        ></input>
                    </div> */}
                </section>

                {/* Buttons */}
                <div className="flex justify-end gap-5 pt-10">
                    <Button
                        name="Reset"
                        variant="secondary"
                        color="black"
                        onClick={() => setFormData(props.data)}
                    >
                        Reset
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
