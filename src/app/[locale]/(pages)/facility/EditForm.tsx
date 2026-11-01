"use client";

import { useRef, useState } from "react";
import Form from "next/form";
import { twMerge } from "tailwind-merge";
import {
    ChevronLeft,
    ChevronRight,
    CircleX,
    ExternalLink,
    Images,
    Languages,
    Link2,
    MapPin,
    PhoneCall,
    Users,
} from "lucide-react";
import { put } from "@vercel/blob/client";
import { redirect } from "next/navigation";

import Card from "@/components/Card";
import { ChildCareFacility, Gender, Verification } from "@prisma/client";
import {
    DistrictsList,
    emptyChildCareFacilityDbObject,
    ProvincesList,
} from "@/utils/defines";
import Button from "@/components/Button";
import {
    addFacility,
    createPhotoUploadToken,
    deleteUnusedPhotos,
    resolveLatLng,
    updateFacility,
} from "@/app/actions/data";
import Link from "next/link";
import { removeKeys } from "@/utils/utils";
import { isInSriLanka } from "@/utils/maps";
import {
    coordsToText,
    parseCoordinates,
    validateFacility,
} from "@/utils/facilityForm";
import {
    isValidSlug,
    PhotoContentTypes,
    photoFileName,
    deletePhotosInBatches,
    isBlobAlreadyExistsError,
    photoBlobPath,
    photoUrl,
    StoredPhoto,
    validatePhotoFile,
} from "@/utils/photos";
import ImageComponent from "@/components/ImageComponent";
import {
    clearAgeRangesVerification,
    clearOccupancyVerification,
    emptyVerification,
    findAgeRangesVerifiedDate,
    findOccupancyVerifiedDate,
    findVerifiedDate,
    setVerifiedDate,
    verifyAgeRanges,
    verifyOccupancy,
} from "@/utils/verification";
import VerifiedOnInput from "./VerifiedOnInput";
import { TranslatedField } from "@/utils/facilityTranslations";

type EditFormProps =
    | { newFacility: true; data?: never }
    | { newFacility: false; data: ChildCareFacility };

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
    /* Set for the whole of a submit, Reset or Clear, including deleting the
        photos they leave unused, so nothing can upload or change photos
        while a delete runs */
    const [saving, setSaving] = useState(false);
    const [photoErrors, setPhotoErrors] = useState<string[]>([]);
    /* Photos that were already stored and reused instead of uploaded */
    const [photoNotes, setPhotoNotes] = useState<string[]>([]);
    const photoInputRef = useRef<HTMLInputElement>(null);

    /* The facility as last saved, which Reset goes back to, and the photos
        uploaded since then. Photos go to Blob as soon as they're picked, so
        these say which stored photos to delete once nothing needs them */
    const savedDataRef = useRef(data);
    const unsavedUploadsRef = useRef<StoredPhoto[]>([]);

    /* Photos are stored under the slug, so it can't change while the
        facility has any or one is uploading, or they would no longer be found */
    const slugLocked = formData.photos.length > 0 || uploadingPhotos;

    /* The latest Maps URL, read after a lookup finishes to discard results
        for a URL that has since been edited or cleared */
    const googleUrlRef = useRef(data.location.google);
    googleUrlRef.current = formData.location.google;

    const verification = formData.verification ?? emptyVerification;

    const setVerification = (changes: Partial<Verification>) => {
        setFormData({
            ...formData,
            verification: { ...verification, ...changes },
        });
    };

    /* The verification keeps the counts that were confirmed, so changed counts
        show as unverified until a new date is entered */
    const setOccupancy = (changes: Partial<ChildCareFacility["occupancy"]>) => {
        setFormData({
            ...formData,
            occupancy: { ...formData.occupancy, ...changes },
        });
    };

    /* A Sinhala value as typed. Empty ones are dropped when the facility is
        saved, so the public page falls back to English. */
    const sinhala = (field: TranslatedField) =>
        formData.translations?.si?.[field] ?? "";

    const setSinhala = (field: TranslatedField, value: string) => {
        setFormData((prev) => ({
            ...prev,
            translations: {
                ...prev.translations,
                si: {
                    name: null,
                    description: null,
                    address: null,
                    city: null,
                    managedBy: null,
                    ...prev.translations?.si,
                    [field]: value,
                },
            },
        }));
    };

    /* The Sinhala inputs, each shown with its English value as a placeholder,
        which the public page uses while the input is empty */
    const sinhalaInputs: {
        field: TranslatedField;
        label: string;
        english: string;
        multiline?: boolean;
    }[] = [
        { field: "name", label: "Name", english: formData.name },
        {
            field: "managedBy",
            label: "Managed By",
            english: formData.managedBy,
        },
        {
            field: "description",
            label: "Description",
            english: formData.description,
            multiline: true,
        },
        {
            field: "address",
            label: "Address",
            english: formData.location.address,
        },
        { field: "city", label: "City", english: formData.location.city },
    ];

    /* Common styles */
    /* One column on phones, with the label above its input. The minmax(0, ...)
       tracks let wide inputs shrink instead of pushing the page sideways. */
    const inputRowStyle =
        "w-full grid grid-cols-1 md:grid-cols-[minmax(0,1fr),minmax(0,3fr)] gap-3 items-center grow";
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
        setPhotoNotes([]);
    };

    const savedPhotos = (): StoredPhoto[] =>
        savedDataRef.current.photos.map((p) => ({
            slug: savedDataRef.current.slug,
            fileName: p.fileName,
        }));

    /* Delete the candidates that aren't in `keep` from storage and return
        the photos actually deleted. The server also refuses to delete any
        photo the saved record still lists. That check uses the record as
        saved, so with the same facility open in two tabs, one can delete a
        photo the other has uploaded or restored but not saved yet. With a
        single admin, that's accepted. */
    const deleteStoredPhotos = async (
        candidates: StoredPhoto[],
        keep: StoredPhoto[],
    ): Promise<StoredPhoto[]> =>
        deletePhotosInBatches(candidates, keep, deleteUnusedPhotos);

    /* After a save: delete the photos the record had before, or that were
        uploaded since, and that the saved facility no longer lists */
    const deletePhotosRemovedBySave = async (saved: ChildCareFacility) => {
        const candidates = [...savedPhotos(), ...unsavedUploadsRef.current];
        const keep = saved.photos.map((p) => ({
            slug: saved.slug,
            fileName: p.fileName,
        }));

        savedDataRef.current = saved;
        unsavedUploadsRef.current = [];
        await deleteStoredPhotos(candidates, keep);
    };

    /* Delete the photos uploaded since the last save, unless the saved
        record has them, and return the ones deleted. Any that couldn't be
        deleted stay tracked, so a later save or reset tries again. */
    const discardUnsavedUploads = async (): Promise<StoredPhoto[]> => {
        const uploads = unsavedUploadsRef.current;

        const deleted = await deleteStoredPhotos(uploads, savedPhotos());
        const deletedPaths = new Set(
            deleted.map((p) => `${p.slug}/${p.fileName}`),
        );

        /* Callers run this while busy, so nothing was uploaded meanwhile */
        unsavedUploadsRef.current = uploads.filter(
            (p) => !deletedPaths.has(`${p.slug}/${p.fileName}`),
        );

        return deleted;
    };

    /* Run a task that saves or deletes photos with the form locked */
    const runBusy = async (task: () => Promise<void>) => {
        if (saving) {
            return;
        }

        setSaving(true);
        try {
            await task();
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () =>
        runBusy(async () => {
            resetForm(savedDataRef.current);
            await discardUnsavedUploads();
        });

    const handleClear = () =>
        runBusy(async () => {
            resetForm(emptyChildCareFacilityDbObject);
            await discardUnsavedUploads();
        });

    /* Adding failed, so no facility uses the uploaded photos: delete them
        and take the deleted ones off the form, so a retry can't save
        references to deleted files */
    const discardUploadsAfterFailedAdd = async () => {
        const slug = formData.slug;
        const discarded = new Set(
            (await discardUnsavedUploads())
                .filter((p) => p.slug === slug)
                .map((p) => p.fileName),
        );
        if (discarded.size === 0) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            photos: prev.photos.filter((p) => !discarded.has(p.fileName)),
        }));
        setPhotoErrors([
            `The facility wasn't saved, so ${discarded.size} uploaded photo${discarded.size === 1 ? " was" : "s were"} removed. Upload them again before submitting.`,
        ]);
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

        /* Store the full URL instead of a shortlink: the profile page falls back
            to the place name in it when a facility has no coordinates */
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
        if (uploadingPhotos || saving) {
            return;
        }

        const slug = formData.slug;
        const errors: string[] = [];
        const notes: string[] = [];
        const knownFileNames = new Set(formData.photos.map((p) => p.fileName));

        setPhotoErrors([]);
        setPhotoNotes([]);
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

                /* Photos are named after their contents, so a photo that's
                    already stored is reused instead of uploaded again */
                let reused = false;
                if ("exists" in result) {
                    reused = true;
                } else {
                    try {
                        await put(photoBlobPath(slug, fileName), file, {
                            access: "public",
                            token: result.token,
                            contentType: file.type,
                        });
                    } catch (error) {
                        /* Stored since the server checked */
                        if (!isBlobAlreadyExistsError(error)) {
                            throw error;
                        }

                        reused = true;
                    }
                }

                if (reused) {
                    notes.push(
                        `${file.name}: this photo was already stored, so the stored copy was reused`,
                    );
                }

                knownFileNames.add(fileName);
                unsavedUploadsRef.current.push({ slug, fileName });
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
        setPhotoNotes(notes);
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

    const handleSubmit = () => runBusy(submitForm);

    const submitForm = async () => {
        const status = validateFacility(formData);

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
            if (status === "success") {
                await deletePhotosRemovedBySave({ ...formData, ...payload });
            } else {
                await discardUploadsAfterFailedAdd();
            }
            alert(status);

            /* On failure stay on the form so the admin's input isn't lost */
            if (status === "success") {
                redirect("/admin");
            }
        } else {
            /* The fact that we are in the edit page means that the database entry exists */
            const status = await updateFacility(payload);
            if (status === "success") {
                await deletePhotosRemovedBySave({ ...formData, ...payload });
            }
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
        <Card className="flex w-full flex-col items-center gap-8 p-5 md:p-10">
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
                                    className="min-w-0 grow"
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

                {/* Sinhala */}
                <section className={sectionStyle}>
                    <div className={sectionHeaderStyles}>
                        <Languages />
                        <h2 className="font-semibold">Sinhala</h2>
                    </div>
                    <p className="w-full text-sm text-gray-600">
                        Shown on the Sinhala pages. Leave a field empty to show
                        the English value instead.
                    </p>

                    {sinhalaInputs.map(
                        ({ field, label, english, multiline }) => {
                            const inputProps = {
                                id: `si-${field}`,
                                lang: "si",
                                className: "grow",
                                placeholder: english,
                                value: sinhala(field),
                                onChange: (
                                    e: React.ChangeEvent<
                                        HTMLInputElement | HTMLTextAreaElement
                                    >,
                                ) => setSinhala(field, e.target.value),
                            };

                            return (
                                <div key={field} className={inputRowStyle}>
                                    <label htmlFor={`si-${field}`}>
                                        {label} (Sinhala)
                                    </label>
                                    {multiline ? (
                                        <textarea {...inputProps}></textarea>
                                    ) : (
                                        <input {...inputProps}></input>
                                    )}
                                </div>
                            );
                        },
                    )}
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
                        <div className="flex min-w-0 grow gap-3">
                            <input
                                className="min-w-0 grow"
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
                        <div className="hidden md:block"></div>
                        <div className="flex flex-wrap gap-3">
                            {formData.contact.phone.map((phone) => (
                                <div
                                    className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl bg-gray-200 px-3 py-2"
                                    key={phone}
                                >
                                    <span>{phone}</span>
                                    <VerifiedOnInput
                                        label={phone}
                                        value={findVerifiedDate(
                                            verification.phones,
                                            phone,
                                        )}
                                        onChange={(date) =>
                                            setVerification({
                                                phones: setVerifiedDate(
                                                    verification.phones,
                                                    phone,
                                                    date,
                                                ),
                                            })
                                        }
                                    />
                                    <button
                                        aria-label={`Remove ${phone}`}
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
                                                verification: {
                                                    ...verification,
                                                    phones: setVerifiedDate(
                                                        verification.phones,
                                                        phone,
                                                        null,
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
                        <div className="flex min-w-0 grow gap-3">
                            <input
                                className="min-w-0 grow"
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
                        <div className="hidden md:block"></div>
                        <div className="flex flex-wrap gap-3">
                            {formData.contact.email.map((email) => (
                                <div
                                    className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl bg-gray-200 px-3 py-2"
                                    key={email}
                                >
                                    <span className="break-all">{email}</span>
                                    <VerifiedOnInput
                                        label={email}
                                        value={findVerifiedDate(
                                            verification.emails,
                                            email,
                                        )}
                                        onChange={(date) =>
                                            setVerification({
                                                emails: setVerifiedDate(
                                                    verification.emails,
                                                    email,
                                                    date,
                                                ),
                                            })
                                        }
                                    />
                                    <button
                                        aria-label={`Remove ${email}`}
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
                                                verification: {
                                                    ...verification,
                                                    emails: setVerifiedDate(
                                                        verification.emails,
                                                        email,
                                                        null,
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
                        <div className="grid items-center gap-3 lg:grid-cols-3 lg:gap-10">
                            <div className="flex flex-col gap-2">
                                <label>Male</label>
                                <input
                                    className="min-w-0 grow"
                                    value={formData.occupancy.male || ""}
                                    type="number"
                                    onChange={(e) =>
                                        setOccupancy({
                                            male: Number(e.target.value),
                                        })
                                    }
                                ></input>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label>Female</label>
                                <input
                                    className="min-w-0 grow"
                                    value={formData.occupancy.female || ""}
                                    type="number"
                                    onChange={(e) =>
                                        setOccupancy({
                                            female: Number(e.target.value),
                                        })
                                    }
                                ></input>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label>Total</label>
                                <input
                                    className="min-w-0 grow"
                                    value={formData.occupancy.total || ""}
                                    type="number"
                                    onChange={(e) =>
                                        setOccupancy({
                                            total: Number(e.target.value),
                                        })
                                    }
                                ></input>
                            </div>
                        </div>
                    </div>

                    {/* Occupancy verification */}
                    <div className={inputRowStyle}>
                        <div className="hidden md:block"></div>
                        <VerifiedOnInput
                            label="Occupancy counts"
                            value={findOccupancyVerifiedDate(
                                formData.occupancy,
                                verification,
                            )}
                            onChange={(date) =>
                                setVerification({
                                    occupancy: date
                                        ? verifyOccupancy(
                                              formData.occupancy,
                                              date,
                                          )
                                        : clearOccupancyVerification(
                                              formData.occupancy,
                                              data.verification?.occupancy,
                                          ),
                                })
                            }
                        />
                    </div>

                    {/* Ages */}
                    <div className={twMerge(inputRowStyle, "pt-8")}>
                        <label>Current Age Ranges</label>
                        <div className="grid items-center gap-3 lg:grid-cols-3 lg:gap-10">
                            <div className="flex flex-col gap-2">
                                <label>Male</label>
                                <input
                                    className="min-w-0 grow"
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
                                    className="min-w-0 grow"
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
                                    className="min-w-0 grow"
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

                    {/* Age ranges verification */}
                    <div className={inputRowStyle}>
                        <div className="hidden md:block"></div>
                        <VerifiedOnInput
                            label="Age ranges"
                            value={findAgeRangesVerifiedDate(
                                formData.ageRanges,
                                verification,
                            )}
                            onChange={(date) =>
                                setVerification({
                                    ageRanges: date
                                        ? verifyAgeRanges(
                                              formData.ageRanges,
                                              date,
                                          )
                                        : clearAgeRangesVerification(
                                              formData.ageRanges,
                                              data.verification?.ageRanges,
                                          ),
                                })
                            }
                        />
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
                                disabled={
                                    !isValidSlug(formData.slug) ||
                                    uploadingPhotos ||
                                    saving
                                }
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
                                disabled={!isValidSlug(formData.slug) || saving}
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
                            {photoNotes.map((note) => (
                                <span
                                    key={note}
                                    role="status"
                                    className="text-sm text-gray-700"
                                >
                                    {note}
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
                                        src={photoUrl(
                                            formData.slug,
                                            photo.fileName,
                                        )}
                                        sizes="200px"
                                        width={200}
                                        height={200}
                                        alt={`Photo ${index + 1}`}
                                        className="aspect-square w-full bg-gray-200 object-cover"
                                    />
                                    <div className="flex items-center gap-3">
                                        <button
                                            aria-label={`Move photo ${index + 1} earlier`}
                                            disabled={index === 0 || saving}
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
                                            disabled={saving}
                                            className="disabled:opacity-30"
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
                                                    formData.photos.length -
                                                        1 || saving
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
                        <div className="flex min-w-0 grow gap-3">
                            <input
                                className="min-w-0 grow"
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
                        <div className="hidden md:block"></div>
                        <div className="flex flex-col items-start gap-2">
                            {formData.sources.map((source) => (
                                <div
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-gray-200 px-3 py-2"
                                    key={source}
                                >
                                    <span className="break-all">{source}</span>
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
                    {/* Only saved facilities have a public page. Use the saved
                        slug, and open a new tab so unsaved edits aren't lost */}
                    {!props.newFacility && (
                        <Link
                            href={`/facility/${data.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                name="View Public Page"
                                type="button"
                                variant="secondary"
                                color="black"
                                className="flex items-center gap-2"
                            >
                                View Public Page
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                    <Button
                        name="Reset"
                        variant="secondary"
                        color="black"
                        disabled={uploadingPhotos || saving}
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        name="Reset"
                        variant="secondary"
                        color="red"
                        disabled={uploadingPhotos || saving}
                        onClick={handleClear}
                    >
                        Clear
                    </Button>
                    <Button
                        name="Reset"
                        type="submit"
                        variant="primary"
                        color="green"
                        disabled={resolvingCoords || uploadingPhotos || saving}
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </div>
            </Form>
        </Card>
    );
}
