import {
    ChildCareFacility,
    FacilityTranslation,
    FacilityTranslations,
} from "@prisma/client";

import { defaultLocale, Locale, locales } from "./locale";

/* The languages a facility can be translated into: every one but English */
export type TranslatedLocale = Exclude<Locale, "en">;

export const translatedLocales = locales.filter(
    (locale): locale is TranslatedLocale => locale !== defaultLocale,
);

export type TranslatedField = keyof FacilityTranslation;

/* The fields of a facility that its translations replace. Address and city
   live under `location`. */
type TranslatableFacility = Pick<
    ChildCareFacility,
    "name" | "description" | "managedBy" | "translations"
> & {
    location: Pick<ChildCareFacility["location"], "address" | "city">;
};

/* Server actions are public endpoints, so a locale argument isn't trusted */
export function parseLocale(value: unknown): Locale {
    return locales.includes(value as Locale)
        ? (value as Locale)
        : defaultLocale;
}

/* The facility's text for the given field in the given language, or the
   English value when it has no translation for it */
export function translatedField(
    translations: FacilityTranslations | null | undefined,
    locale: Locale,
    field: TranslatedField,
    english: string,
): string {
    if (locale === defaultLocale) {
        return english;
    }

    const translated =
        translations?.[locale as TranslatedLocale]?.[field]?.trim();

    return translated ? translated : english;
}

/* The facility with its text in the given language, field by field, falling
   back to English wherever a translation is missing. The translations stay
   on the result. */
export function localizeFacility<T extends TranslatableFacility>(
    facility: T,
    locale: Locale,
): T {
    if (locale === defaultLocale) {
        return facility;
    }

    const value = (field: TranslatedField, english: string) =>
        translatedField(facility.translations, locale, field, english);

    return {
        ...facility,
        name: value("name", facility.name),
        description: value("description", facility.description),
        managedBy: value("managedBy", facility.managedBy),
        location: {
            ...facility.location,
            address: value("address", facility.location.address),
            city: value("city", facility.location.city),
        },
    };
}

/* Sheet column for a field's translation, e.g. "Name (Sinhala)" */
const sheetLanguageNames: Record<TranslatedLocale, string> = {
    si: "Sinhala",
};

const sheetFieldColumns: Record<TranslatedField, string> = {
    name: "Name",
    description: "Description",
    address: "Address",
    city: "City",
    managedBy: "Managed By",
};

export function translationColumn(
    locale: TranslatedLocale,
    field: TranslatedField,
): string {
    return `${sheetFieldColumns[field]} (${sheetLanguageNames[locale]})`;
}

/* Reads the translation columns of a Database sheet row. Returns undefined
   when the sheet has none of them, so syncing a sheet without the columns
   keeps the saved translations. Otherwise the sheet decides: an empty cell
   clears that translation. */
export function parseSheetTranslations(
    row: Record<string, string>,
): FacilityTranslations | null | undefined {
    const hasColumns = translatedLocales.some((locale) =>
        translatedFields.some(
            (field) => translationColumn(locale, field) in row,
        ),
    );

    if (!hasColumns) {
        return undefined;
    }

    return buildTranslations(
        (locale, field) => row[translationColumn(locale, field)],
    );
}

export const translatedFields = Object.keys(
    sheetFieldColumns,
) as TranslatedField[];

/* Builds the translations from the value read for each language and field.
   Values are trimmed, empty ones left out, and a language with no values at
   all is dropped, so the English fallback applies. Null when nothing is left. */
function buildTranslations(
    read: (locale: TranslatedLocale, field: TranslatedField) => unknown,
): FacilityTranslations | null {
    const translations: FacilityTranslations = { si: null };
    let any = false;

    for (const locale of translatedLocales) {
        const entry: FacilityTranslation = {
            name: null,
            description: null,
            address: null,
            city: null,
            managedBy: null,
        };
        let anyField = false;

        for (const field of translatedFields) {
            const value = read(locale, field);
            const text = typeof value === "string" ? value.trim() : "";
            if (text) {
                entry[field] = text;
                anyField = true;
            }
        }

        if (anyField) {
            translations[locale] = entry;
            any = true;
        }
    }

    return any ? translations : null;
}

/* The translations an admin form sent, ready to save. Server actions are
   public endpoints, so anything that isn't a string is ignored. */
export function normalizeTranslations(
    translations: unknown,
): FacilityTranslations | null {
    const entries =
        translations && typeof translations === "object"
            ? (translations as Record<string, unknown>)
            : {};

    return buildTranslations((locale, field) => {
        const entry = entries[locale];

        return entry && typeof entry === "object"
            ? (entry as Record<string, unknown>)[field]
            : undefined;
    });
}
