import fs from "fs";
import path from "path";
import { put, list } from "@vercel/blob";

import { ChildCareFacility, PrismaClient } from "@prisma/client";

const JSON_FNAME = path.join(__dirname, "data", "dbData.json");
const PHOTOS_DIR = path.join(__dirname, "data", "photos");

const prisma = new PrismaClient();

async function vercelUpload(
    id: string,
    vercelPath: string,
    fileBuffer: Buffer<ArrayBufferLike>,
): Promise<string> {
    /* Check if the file already exists */
    const blobs = await list({
        prefix: id,
        token: process.env.VERCEL_TOKEN,
    });

    const blobExists = blobs.blobs.some((blob) => blob.pathname == vercelPath);

    if (!blobExists) {
        const newBlob = await put(vercelPath, fileBuffer, {
            access: "public",
            token: process.env.VERCEL_TOKEN,
            addRandomSuffix: false,
        });

        console.log("Uploaded successfully! Blob URL:", newBlob.url);
        return newBlob.url;
    } else {
        console.log("File already exists:", vercelPath);
        return "";
    }
}

async function upsertFacilities(jsonData: ChildCareFacility[]) {
    let updatedCount = 0;

    await Promise.all(
        jsonData.map(async (facility, idx) => {
            try {
                /* Upsert the facility */
                const entry = await prisma.childCareFacility.upsert({
                    where: {
                        name: facility.name,
                    },
                    create: facility,
                    update: {
                        /* Uncomment the fields that need to updated */
                        name: facility.name,
                        type: facility.type,
                        managedBy: facility.managedBy,
                        location: {
                            address: facility.location.address,
                            city: facility.location.city,
                            district: facility.location.district,
                            province: facility.location.province,
                            divisionalSecretariat:
                                facility.location.divisionalSecretariat,
                            google: facility.location.google,
                        },
                        contact: {
                            phone: facility.contact.phone,
                            email: facility.contact.email,
                            website: facility.contact.website,
                            facebook: facility.contact.facebook,
                            instagram: facility.contact.instagram,
                        },
                        genders: facility.genders,
                        occupancy: {
                            total: facility.occupancy.total,
                            male: facility.occupancy.male,
                            female: facility.occupancy.female,
                        },
                        ageRanges: {
                            all: facility.ageRanges.all,
                            male: facility.ageRanges.male,
                            female: facility.ageRanges.female,
                        },
                        photos: facility.photos,
                    },
                });

                /* Upload any available photos to Vercel blob */
                const facilityPhotosDir = path.join(PHOTOS_DIR, idx.toString());

                if (
                    !fs.existsSync(facilityPhotosDir) ||
                    facility.photos.length == 0
                ) {
                    return;
                }

                await Promise.all(
                    facility.photos.map(async (photo) => {
                        const filePath = path.join(
                            facilityPhotosDir,
                            photo.fileName,
                        );

                        if (fs.lstatSync(filePath).isFile()) {
                            const fileBuffer = fs.readFileSync(filePath);
                            const blobUrl = await vercelUpload(
                                entry.id,
                                `${entry.id}/${photo.fileName}`,
                                fileBuffer,
                            );
                        }
                    }),
                );

                updatedCount += 1;
            } catch (error) {
                console.error("Facility upsert failed:", error);
                console.error("Facility:", facility);
            }
        }),
    );

    console.log(
        `Successfully updated/inserted ${updatedCount} / ${jsonData.length} facilities`,
    );
    await prisma.$disconnect();
}

const helpString = "Usage: tsx dbOperations.ts upsert";

if (process.argv.length == 3) {
    const cmd = process.argv[2];

    fs.promises
        .readFile(JSON_FNAME, "utf-8")
        .then((data) => {
            return JSON.parse(data);
        })
        .then(async (jsonData) => {
            if (cmd == "upsert") {
                await upsertFacilities(jsonData);
            } else {
                console.log(helpString);
            }
        });
} else {
    console.log(helpString);
}
