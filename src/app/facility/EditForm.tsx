"use client";

import { useRef, useState } from "react";
import Form from "next/form";
import { twMerge } from "tailwind-merge";
import {
    ChevronLeft,
    ChevronRight,
    CircleX,
    Images,
    Link2,
    MapPin,
    PhoneCall,
    Users,
} from "lucide-react";
import { put } from "@vercel/blob/client";
import { redirect } from "next/navigation";

import Card from "@/components/Card";
import { ChildCareFacility, Gender } from "@prisma/client";
import {
    DistrictsList,
    emptyChildCareFacilityDbObject,
    ProvincesList,
    vercelStorageUrl,
} from "@/utils/defines";
import Button from "@/components/Button";
import {
    addFacility,
    createPhotoUploadToken,
    resolveLatLng,
    updateFacility,
} from "@/app/actions/data";
import Link from "next/link";
import { removeKeys } from "@/utils/utils";
import {
    hasCoordinates,
    isInSriLanka,
    isValidLatitude,
    isValidLongitude,
    LatLng,
} from "@/utils/maps";
import {
    isValidSlug,
    PhotoContentTypes,
    photoFileName,
    validatePhotoFile,
} from "@/utils/photos";
import ImageComponent from "@/components/ImageComponent";

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

const coordsToText = (
    location: ChildCareFacility["location"],
): [string, string] => {
    if (!hasCoordinates(location)) {
        return ["", ""];
    }

    return [String(location.latitude), String(location.longitude)];
};

const COORDINATE_PATTERN = /^-?\d+(\.\d+)?$/;

/* Parses the latitude/longitude inputs. Both empty is valid and means "no coordinates". */
const parseCoordinates = (
    latitudeText: string,
    longitudeText: string,
): { coords: LatLng | null } | { error: string } => {
    const lat = latitudeText.trim();
    const lng = longitudeText.trim();

    if (!lat && !lng) {
        return { coords: null };
    }

    if (!lat || !lng) {
        return {
            error: "Enter both latitude and longitude, or leave both empty",
        };
    }

    const latitude = COORDINATE_PATTERN.test(lat) ? Number(lat) : NaN;
    const longitude = COORDINATE_PATTERN.test(lng) ? Number(lng) : NaN;

    if (!isValidLatitude(latitude)) {
        return { error: "Latitude must be a number between -90 and 90" };
    }

    if (!isValidLongitude(longitude)) {
        return { error: "Longitude must be a number between -180 and 180" };
    }

    return { coords: { latitude, longitude } };
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
    const [newPhoneNumber, setNewPhoneNumber] = useState("");
    const [newEmailAddress, setNewEmailAddress] = useState("");
    const [newSource, setNewSource] = useState("");
    const [latitudeText, setLatitudeText] = useState(
        coordsToText(data.location)[0],
    );
    const [longitudeText, setLongitudeText] = useState(
        coordsToText(data.location)[1],
    );
    const [resolvingCoords, setResolvingCoords] = useState(false);
    const [resolveError, setResolveError] = useState("");
    const [resolveNote, setResolveNote] = useState("");
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [photoErrors, setPhotoErrors] = useState<string[]>([]);
    const photoInputRef = useRef<HTMLInputElement>(null);

    /* Photos are stored under the slug, so it can't change while the
        facility has any, or they would no longer be found */
    const slugLocked = formData.photos.length > 0;

    /* The latest Maps URL, read after a lookup finishes to discard results
        for a URL that has since been edited or cleared */
    const googleUrlRef = useRef(data.location.google);
    googleUrlRef.current = formData.location.google;

    /* Common styles */
    const inputRowStyle =
        "w-full grid grid-cols-[1fr,3fr] gap-3 items-center grow";
    const sectionStyle = "flex flex-col items-center gap-5 pt-5";
    const sectionHeaderStyles =
        "flex items-center justify-start gap-2 pl-5 md:text-xl text-lg";

    const resetForm = (values: ChildCareFacility) => {
        setFormData(values);
        const [latitude, longitude] = coordsToText(values.location);
        setLatitudeText(latitude);
        setLongitudeText(longitude);
        setResolveError("");
        setResolveNote("");
        setPhotoErrors([]);
    };

    const handleClear = () => {
        resetForm(emptyChildCareFacilityDbObject);
    };

    const handleResolveCoordinates = async () => {
        setResolveError("");
        setResolveNote("");
        setResolvingCoords(true);

        const requestedUrl = formData.location.google;
        let result: Awaited<ReturnType<typeof resolveLatLng>>;
        try {
            result = await resolveLatLng(requestedUrl);
        } catch {
            result = { error: "Something went wrong while resolving the URL" };
        } finally {
            setResolvingCoords(false);
        }

        if (googleUrlRef.current !== requestedUrl) {
            return;
        }

        if ("error" in result) {
            setResolveError(result.error);
            return;
        }

        const unchanged =
            Number(latitudeText) === result.latitude &&
            Number(longitudeText) === result.longitude;

        if ((latitudeText.trim() || longitudeText.trim()) && !unchanged) {
            const current = `${latitudeText.trim() || "-"}, ${longitudeText.trim() || "-"}`;
            const resolved = `${result.latitude}, ${result.longitude}`;

            if (!confirm(`Replace ${current} with ${resolved}?`)) {
                return;
            }
        }

        setLatitudeText(String(result.latitude));
        setLongitudeText(String(result.longitude));

        /* Store the full URL instead of a shortlink: the profile page needs the
            place name in it to show the embedded map */
        if (result.resolvedUrl !== requestedUrl.trim()) {
            /* Use the latest form state: the lookup can take several seconds,
                and other fields may have been edited meanwhile */
            setFormData((prev) => ({
                ...prev,
                location: { ...prev.location, google: result.resolvedUrl },
            }));
            setResolveNote(
                "Replaced the shortlink with the full Google Maps URL",
            );
        }
    };

    const handlePhotoUpload = async (files: File[]) => {
        const slug = formData.slug;
        const errors: string[] = [];
        const knownFileNames = new Set(formData.photos.map((p) => p.fileName));

        setPhotoErrors([]);
        setUploadingPhotos(true);

        for (const file of files) {
            const invalid = validatePhotoFile(file);
            if (invalid) {
                errors.push(invalid);
                continue;
            }

            try {
                const fileName = await photoFileName(file);
                if (knownFileNames.has(fileName)) {
                    errors.push(`${file.name}: this photo is already added`);
                    continue;
                }

                const result = await createPhotoUploadToken(slug, fileName);
                if ("error" in result) {
                    errors.push(`${file.name}: ${result.error}`);
                    continue;
                }

                await put(`${slug}/${fileName}`, file, {
                    access: "public",
                    token: result.token,
                    contentType: file.type,
                });

                knownFileNames.add(fileName);
                /* Use the latest form state: other fields may have been
                    edited while the upload was running */
                setFormData((prev) => ({
                    ...prev,
                    photos: [...prev.photos, { fileName, source: "" }],
                }));
            } catch (error) {
                console.log("Photo upload failed", error);
                errors.push(`${file.name}: upload failed, please try again`);
            }
        }

        setPhotoErrors(errors);
        setUploadingPhotos(false);
    };

    const movePhoto = (index: number, offset: -1 | 1) => {
        const target = index + offset;
        if (target < 0 || target >= formData.photos.length) {
            return;
        }

        const photos = [...formData.photos];
        [photos[index], photos[target]] = [photos[target], photos[index]];
        setFormData({ ...formData, photos: photos });
    };

    const handleSubmit = async () => {
        const status = validate(formData);

        if (status !== "success") {
            alert(status);
            return;
        }

        const parsed = parseCoordinates(latitudeText, longitudeText);
        if ("error" in parsed) {
            alert(parsed.error);
            return;
        }

        if (
            parsed.coords &&
            !isInSriLanka(parsed.coords) &&
            !confirm(
                "These coordinates are outside Sri Lanka. Save them anyway?",
            )
        ) {
            return;
        }

        const payload = removeKeys(
            {
                ...formData,
                location: {
                    ...formData.location,
                    latitude: parsed.coords?.latitude ?? null,
                    longitude: parsed.coords?.longitude ?? null,
                },
            },
            ["id", "createdAt", "updatedAt"],
        );

        if (props.newFacility) {
            const status = await addFacility(payload);
            alert(status);
            redirect("/admin");
        } else {
            /* The fact that we are in the edit page means that the database entry exists */
            const status = await updateFacility(payload);
            alert(status);
        }
    };

    /* Validation functions */
    const isValidPhoneNumber = (value: string): boolean => {
        if (!/0[0-9]{9}/.test(value)) {
            alert("Invalid phone number. Must start with 0 and have 10 digits");
            return false;
        }

        return true;
    };

    const isValidEmailAddress = (value: string): boolean => {
        if (!/^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
            alert("Invalid email address");
            return false;
        }

        return true;
    };

    const isValidUrl = (value: string, list: string[]): boolean => {
        if (
            !/((http(s)?:\/\/)(www\.)?|www\.)[a-zA-Z0-9@:%._+~#?&\/=]+/.test(
                value,
            )
        ) {
            alert(
                'Invalid URL. Must start with "http://", "https://" or "www."',
            );
            return false;
        }

        if (list.includes(value)) {
            alert("Source already exists");
            return false;
        }

        return true;
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
                            className="grow read-only:bg-gray-100 read-only:text-gray-500"
                            value={formData.slug}
                            readOnly={slugLocked}
                            title={
                                slugLocked
                                    ? "Remove all photos to change the slug"
                                    : undefined
                            }
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
                        <label htmlFor="google-maps-url">Google Maps</label>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <input
                                    id="google-maps-url"
                                    className="grow"
                                    value={formData.location.google}
                                    onChange={(e) => {
                                        setResolveError("");
                                        setResolveNote("");
                                        setFormData({
                                            ...formData,
                                            location: {
                                                ...formData.location,
                                                google: e.target.value,
                                            },
                                        });
                                    }}
                                ></input>
                                <Button
                                    name="Resolve Coordinates"
                                    type="button"
                                    variant="secondary"
                                    color="green"
                                    className="shrink-0 text-sm"
                                    disabled={!formData.location.google.trim()}
                                    loading={resolvingCoords}
                                    loadingText="Resolving"
                                    onClick={handleResolveCoordinates}
                                >
                                    Resolve Latitude and Longitude
                                </Button>
                            </div>
                            {resolveNote && (
                                <p className="text-sm text-green-800">
                                    {resolveNote}
                                </p>
                            )}
                            {resolveError && (
                                <p
                                    role="alert"
                                    className="text-sm text-red-700"
                                >
                                    {resolveError}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={inputRowStyle}>
                        <label htmlFor="latitude">Latitude</label>
                        <input
                            id="latitude"
                            className="grow"
                            inputMode="decimal"
                            placeholder="e.g. 7.2906"
                            disabled={resolvingCoords}
                            value={latitudeText}
                            onChange={(e) => setLatitudeText(e.target.value)}
                        ></input>
                    </div>

                    <div className={inputRowStyle}>
                        <label htmlFor="longitude">Longitude</label>
                        <input
                            id="longitude"
                            className="grow"
                            inputMode="decimal"
                            placeholder="e.g. 80.6337"
                            disabled={resolvingCoords}
                            value={longitudeText}
                            onChange={(e) => setLongitudeText(e.target.value)}
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
                                value={newPhoneNumber}
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

                                    if (isValidPhoneNumber(newPhoneNumber)) {
                                        setFormData({
                                            ...formData,
                                            contact: {
                                                ...formData.contact,
                                                phone: [
                                                    ...formData.contact.phone,
                                                    newPhoneNumber,
                                                ],
                                            },
                                        });
                                        setNewPhoneNumber("");
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

                {/* Photos */}
                <section className={sectionStyle}>
                    <div className={sectionHeaderStyles}>
                        <Images />
                        <h2 className="font-semibold">Photos</h2>
                    </div>

                    <div className={inputRowStyle}>
                        <label htmlFor="photo-upload">Upload</label>
                        <div className="flex flex-col items-start gap-2">
                            <input
                                id="photo-upload"
                                ref={photoInputRef}
                                type="file"
                                accept={Object.keys(PhotoContentTypes).join(
                                    ",",
                                )}
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(
                                        e.target.files ?? [],
                                    );
                                    /* Clear it so picking the same file again still fires onChange */
                                    e.target.value = "";
                                    if (files.length > 0) {
                                        handlePhotoUpload(files);
                                    }
                                }}
                            />
                            <Button
                                name="Upload Photos"
                                variant="secondary"
                                color="black"
                                disabled={!isValidSlug(formData.slug)}
                                loading={uploadingPhotos}
                                loadingText="Uploading"
                                onClick={(e) => {
                                    e.preventDefault();
                                    photoInputRef.current?.click();
                                }}
                            >
                                Upload Photos
                            </Button>
                            <span className="text-sm text-gray-600">
                                {isValidSlug(formData.slug)
                                    ? "JPEG, PNG or WebP, up to 10 MB each. Click Submit to save photo changes."
                                    : "Enter a valid slug (lowercase letters, numbers and hyphens) before uploading photos."}
                            </span>
                            {photoErrors.map((error) => (
                                <span
                                    key={error}
                                    role="alert"
                                    className="text-sm text-red-700"
                                >
                                    {error}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Current photos, in the order the carousel shows them */}
                    {formData.photos.length > 0 && (
                        <ul
                            aria-label="Facility photos"
                            className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                        >
                            {formData.photos.map((photo, index) => (
                                <li
                                    key={photo.fileName}
                                    data-file-name={photo.fileName}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <ImageComponent
                                        src={`${vercelStorageUrl}/${formData.slug}/${photo.fileName}`}
                                        sizes="200px"
                                        width={200}
                                        height={200}
                                        alt={`Photo ${index + 1}`}
                                        className="aspect-square w-full bg-gray-200 object-cover"
                                    />
                                    <div className="flex items-center gap-3">
                                        <button
                                            aria-label={`Move photo ${index + 1} earlier`}
                                            disabled={index === 0}
                                            className="disabled:opacity-30"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                movePhoto(index, -1);
                                            }}
                                        >
                                            <ChevronLeft />
                                        </button>
                                        <button
                                            aria-label={`Remove photo ${index + 1}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFormData({
                                                    ...formData,
                                                    photos: formData.photos.filter(
                                                        (p) =>
                                                            p.fileName !==
                                                            photo.fileName,
                                                    ),
                                                });
                                            }}
                                        >
                                            <CircleX />
                                        </button>
                                        <button
                                            aria-label={`Move photo ${index + 1} later`}
                                            disabled={
                                                index ===
                                                formData.photos.length - 1
                                            }
                                            className="disabled:opacity-30"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                movePhoto(index, 1);
                                            }}
                                        >
                                            <ChevronRight />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Sources */}
                <section className={sectionStyle}>
                    <div className={sectionHeaderStyles}>
                        <Link2 />
                        <h2 className="font-semibold">Sources</h2>
                    </div>

                    {/* Sources input */}
                    <div className={inputRowStyle}>
                        <label>Sources</label>
                        <div className="flex grow gap-5">
                            <input
                                className="grow"
                                value={newSource}
                                onChange={(e) => setNewSource(e.target.value)}
                            ></input>
                            <Button
                                name="Add"
                                variant="secondary"
                                color="black"
                                onClick={(e) => {
                                    e.preventDefault();

                                    if (
                                        isValidUrl(newSource, formData.sources)
                                    ) {
                                        setFormData({
                                            ...formData,
                                            sources: [
                                                ...formData.sources,
                                                newSource,
                                            ],
                                        });
                                        setNewSource("");
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Current list of sources */}
                    <div className={inputRowStyle}>
                        <div></div>
                        <div className="flex flex-col items-start gap-2">
                            {formData.sources.map((source) => (
                                <div
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-gray-200 px-3 py-2"
                                    key={source}
                                >
                                    <span>{source}</span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFormData({
                                                ...formData,
                                                sources:
                                                    formData.sources.filter(
                                                        (s) => s !== source,
                                                    ),
                                            });
                                        }}
                                    >
                                        <CircleX />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Buttons */}
                <div className="flex flex-col items-center justify-end gap-5 pt-10 md:flex-row">
                    <Link href="/admin">
                        <Button name="Reset" variant="secondary" color="black">
                            Back to Table
                        </Button>
                    </Link>
                    <Button
                        name="Reset"
                        variant="secondary"
                        color="black"
                        onClick={() => resetForm(data)}
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
                        disabled={resolvingCoords || uploadingPhotos}
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
