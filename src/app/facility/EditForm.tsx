"use client";

import { useState } from "react";
import Form from "next/form";
import { twMerge } from "tailwind-merge";
import { CircleX, MapPin, PhoneCall, Users } from "lucide-react";
import { redirect } from "next/navigation";

import Card from "@/components/Card";
import { ChildCareFacility, Gender } from "@prisma/client";
import {
    DistrictsList,
    emptyChildCareFacilityDbObject,
    ProvincesList,
} from "@/utils/defines";
import Button from "@/components/Button";
import { addFacility, updateFacility } from "@/app/actions/data";
import Link from "next/link";
import { removeKeys } from "@/utils/utils";

type EditFormProps =
    | { newFacility: true; data?: never }
    | { newFacility: false; data: ChildCareFacility };

const validate = (data: ChildCareFacility) => {
    if (!data.slug) {
        return "Slug is required";
    }

    if (!data.name) {
        return "Name is required";
    }

    return "success";
};

export default function EditForm(props: EditFormProps) {
    if (!props.newFacility && !props.data) {
        return (
            <h1 className="justify-center text-2xl font-semibold">
                Something went wrong
            </h1>
        );
    }

    const data = props.data || emptyChildCareFacilityDbObject;

    const [formData, setFormData] = useState<ChildCareFacility>(data);
    const [mewPhoneNumber, setNewPhoneNumber] = useState("");
    const [newEmailAddress, setNewEmailAddress] = useState("");

    /* Common styles */
    const inputRowStyle =
        "w-full grid grid-cols-[1fr,3fr] gap-3 items-center grow";
    const sectionStyle = "flex flex-col items-center gap-5 pt-5";
    const sectionHeaderStyles =
        "flex items-center justify-start gap-2 pl-5 md:text-xl text-lg";

    const handleClear = () => {
        setFormData(emptyChildCareFacilityDbObject);
    };

    const handleSubmit = async () => {
        const status = validate(formData);

        if (status !== "success") {
            alert(status);
            return;
        }

        if (props.newFacility) {
            const status = await addFacility(
                removeKeys(formData, ["id", "createdAt", "updatedAt"]),
            );
            alert(status);
            redirect("/admin");
        } else {
            /* The fact that we are in the edit page means that the database entry exists */
            const status = await updateFacility(
                removeKeys(formData, ["id", "createdAt", "updatedAt"]),
            );
            alert(status);
        }
    };

    /* Validation functions */
    const isValidPhoneNumber = (value: string): boolean => {
        if (/0[0-9]{9}/.test(value)) {
            return true;
        }

        return false;
    };

    const isValidEmailAddress = (value: string): boolean => {
        if (/^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
            return true;
        }

        return false;
    };

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
                        <label>Database Slug</label>
                        <input
                            className="grow"
                            value={formData.slug}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    slug: e.target.value,
                                })
                            }
                        ></input>
                    </div>
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
                            <option value=""></option>
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
                            <option value=""></option>
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
                            <option value=""></option>
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
                        <h2 className="font-semibold">Contact Info</h2>
                    </div>

                    {/* Phone numbers */}
                    <div className={inputRowStyle}>
                        <label>Phone Numbers</label>
                        <div className="flex grow gap-5">
                            <input
                                className="grow"
                                value={mewPhoneNumber}
                                onChange={(e) =>
                                    setNewPhoneNumber(e.target.value)
                                }
                            ></input>
                            <Button
                                name="Add"
                                variant="secondary"
                                color="black"
                                onClick={(e) => {
                                    e.preventDefault();

                                    if (isValidPhoneNumber(mewPhoneNumber)) {
                                        setFormData({
                                            ...formData,
                                            contact: {
                                                ...formData.contact,
                                                phone: [
                                                    ...formData.contact.phone,
                                                    mewPhoneNumber,
                                                ],
                                            },
                                        });
                                        setNewPhoneNumber("");
                                    } else {
                                        alert("Invalid phone number");
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Current list of phone numbers */}
                    <div className={inputRowStyle}>
                        <div></div>
                        <div className="flex gap-3">
                            {formData.contact.phone.map((phone) => (
                                <div
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-gray-200 px-3 py-2"
                                    key={phone}
                                >
                                    <span>{phone}</span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFormData({
                                                ...formData,
                                                contact: {
                                                    ...formData.contact,
                                                    phone: formData.contact.phone.filter(
                                                        (p) => p !== phone,
                                                    ),
                                                },
                                            });
                                        }}
                                    >
                                        <CircleX />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Email addresses */}
                    <div className={twMerge(inputRowStyle, "pt-10")}>
                        <label>Email Addresses</label>
                        <div className="flex grow gap-5">
                            <input
                                className="grow"
                                value={newEmailAddress}
                                onChange={(e) =>
                                    setNewEmailAddress(e.target.value)
                                }
                            ></input>
                            <Button
                                name="Add"
                                variant="secondary"
                                color="black"
                                onClick={(e) => {
                                    e.preventDefault();

                                    if (isValidEmailAddress(newEmailAddress)) {
                                        setFormData({
                                            ...formData,
                                            contact: {
                                                ...formData.contact,
                                                email: [
                                                    ...formData.contact.email,
                                                    newEmailAddress,
                                                ],
                                            },
                                        });
                                        setNewEmailAddress("");
                                    } else {
                                        alert("Invalid email address");
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Current list of email addresses */}
                    <div className={inputRowStyle}>
                        <div></div>
                        <div className="flex gap-3">
                            {formData.contact.email.map((email) => (
                                <div
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-gray-200 px-3 py-2"
                                    key={email}
                                >
                                    <span>{email}</span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFormData({
                                                ...formData,
                                                contact: {
                                                    ...formData.contact,
                                                    email: formData.contact.email.filter(
                                                        (p) => p !== email,
                                                    ),
                                                },
                                            });
                                        }}
                                    >
                                        <CircleX />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Website */}
                    <div className={twMerge(inputRowStyle, "pt-10")}>
                        <label>Website</label>
                        <input
                            className="grow"
                            value={formData.contact.website}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    contact: {
                                        ...formData.contact,
                                        website: e.target.value,
                                    },
                                })
                            }
                        ></input>
                    </div>

                    {/* Facebook */}
                    <div className={inputRowStyle}>
                        <label>Facebook</label>
                        <input
                            className="grow"
                            value={formData.contact.facebook}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    contact: {
                                        ...formData.contact,
                                        facebook: e.target.value,
                                    },
                                })
                            }
                        ></input>
                    </div>

                    {/* Instagram */}
                    <div className={inputRowStyle}>
                        <label>Instagram</label>
                        <input
                            className="grow"
                            value={formData.contact.instagram}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    contact: {
                                        ...formData.contact,
                                        instagram: e.target.value,
                                    },
                                })
                            }
                        ></input>
                    </div>
                </section>

                {/* Resident Info */}
                <section className={sectionStyle}>
                    <div className={sectionHeaderStyles}>
                        <Users />
                        <h2 className="font-semibold">Resident Info</h2>
                    </div>

                    {/* Genders */}
                    <div className={inputRowStyle}>
                        <label>Genders</label>
                        <select
                            className="grow"
                            value={formData.genders}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    genders: e.target.value as Gender,
                                })
                            }
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="both">Both</option>
                            <option value="unknown">Unknown</option>
                        </select>
                    </div>

                    {/* Occupancy */}
                    <div className={twMerge(inputRowStyle, "pt-8")}>
                        <label>Current Occupants</label>
                        <div className="grid items-center gap-3 lg:grid-cols-[1fr,1fr,1fr] lg:gap-10">
                            <div className="flex flex-col gap-2">
                                <label>Male</label>
                                <input
                                    className="grow"
                                    value={formData.occupancy.male || ""}
                                    type="number"
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            occupancy: {
                                                ...formData.occupancy,
                                                male: Number(e.target.value),
                                            },
                                        })
                                    }
                                ></input>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label>Female</label>
                                <input
                                    className="grow"
                                    value={formData.occupancy.female || ""}
                                    type="number"
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            occupancy: {
                                                ...formData.occupancy,
                                                female: Number(e.target.value),
                                            },
                                        })
                                    }
                                ></input>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label>Total</label>
                                <input
                                    className="grow"
                                    value={formData.occupancy.total || ""}
                                    type="number"
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            occupancy: {
                                                ...formData.occupancy,
                                                total: Number(e.target.value),
                                            },
                                        })
                                    }
                                ></input>
                            </div>
                        </div>
                    </div>

                    {/* Ages */}
                    <div className={twMerge(inputRowStyle, "pt-8")}>
                        <label>Current Age Ranges</label>
                        <div className="grid items-center gap-3 lg:grid-cols-[1fr,1fr,1fr] lg:gap-10">
                            <div className="flex flex-col gap-2">
                                <label>Male</label>
                                <input
                                    className="grow"
                                    value={formData.ageRanges.male || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            ageRanges: {
                                                ...formData.ageRanges,
                                                male: e.target.value,
                                            },
                                        })
                                    }
                                ></input>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label>Female</label>
                                <input
                                    className="grow"
                                    value={formData.ageRanges.female || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            ageRanges: {
                                                ...formData.ageRanges,
                                                female: e.target.value,
                                            },
                                        })
                                    }
                                ></input>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label>All</label>
                                <input
                                    className="grow"
                                    value={formData.ageRanges.all || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            ageRanges: {
                                                ...formData.ageRanges,
                                                all: e.target.value,
                                            },
                                        })
                                    }
                                ></input>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Buttons */}
                <div className="flex justify-end gap-5 pt-10">
                    <Link href="/admin">
                        <Button name="Reset" variant="secondary" color="black">
                            Back to Table
                        </Button>
                    </Link>
                    <Button
                        name="Reset"
                        variant="secondary"
                        color="black"
                        onClick={() => setFormData(data)}
                    >
                        Reset
                    </Button>
                    <Button
                        name="Reset"
                        variant="secondary"
                        color="red"
                        onClick={handleClear}
                    >
                        Clear
                    </Button>
                    <Button
                        name="Reset"
                        type="submit"
                        variant="primary"
                        color="green"
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
