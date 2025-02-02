import { ChildCareFacility, PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function addFacilities(jsonData: ChildCareFacility[]) {
    try {
        const facilities = await prisma.childCareFacility.createMany({
            data: jsonData,
        });

        console.log(`Successfully added ${facilities.count} facilities`);
    } catch (error) {
        console.error("Facility creation failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

async function upsertFacilities(jsonData: ChildCareFacility[]) {
    let updatedCount = 0;

    await Promise.all(
        jsonData.map(async (facility) => {
            try {
                await prisma.childCareFacility.upsert({
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
                            district: facility.location.district,
                            province: facility.location.province,
                            divisionalSecretariat:
                                facility.location.divisionalSecretariat,
                        },
                        contact: {
                            phone: facility.contact.phone,
                            email: facility.contact.email,
                            website: facility.contact.website,
                        },
                        residents: {
                            total: facility.residents.total,
                            male: facility.residents.male,
                            female: facility.residents.female,
                        },
                    },
                });

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

const helpString = "Usage: tsx dbOperations.ts <add|upsert>";

if (process.argv.length == 3) {
    const cmd = process.argv[2];

    fs.readFile("data.json", "utf-8")
        .then((data) => {
            return JSON.parse(data);
        })
        .then(async (jsonData) => {
            if (cmd == "add") {
                await addFacilities(jsonData);
            } else if (cmd == "upsert") {
                await upsertFacilities(jsonData);
            } else {
                console.log(helpString);
            }
        });
} else {
    console.log(helpString);
}
