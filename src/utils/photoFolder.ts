/* Kept free of imports so next.config.ts can use it */

/* Local dev and Vercel previews keep their photos under this folder, so
   their uploads never touch production's photos */
export const DEV_PHOTO_FOLDER = "dev";

/* The Blob folder photos live in for a VERCEL_ENV: none in production, and
   DEV_PHOTO_FOLDER anywhere else, so an unknown environment stays out of
   production's photos */
export const photoFolderFor = (vercelEnv: string | undefined): string =>
    vercelEnv === "production" ? "" : DEV_PHOTO_FOLDER;
