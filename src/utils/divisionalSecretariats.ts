/* Sri Lanka's divisional secretariats, with their districts and Sinhala
   names. Sinhala names are added once the site owner has approved them;
   until then a name falls back to English. The list is the Survey
   Department's administrative boundaries
   (COD-AB, version 03, valid from 2022-08-16), published by OCHA on HDX as
   "Sri Lanka - Subnational Administrative Boundaries" (cod-ab-lka, ADM3),
   licensed CC BY-IGO. Facilities store the English name. */

import list from "../data/divisionalSecretariats.json";

import { defaultLocale, Locale } from "./locale";

export type DivisionalSecretariat = {
    /* The Survey Department's P-code, e.g. LK1103 */
    code: string;
    district: string;
    en: string;
    si?: string;
};

export const divisionalSecretariats: DivisionalSecretariat[] = list;

/* Compares names ignoring case and repeated spaces */
const comparable = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();

/* The divisional secretariats in a district, or all of them without one */
export function divisionalSecretariatsIn(
    district: string,
): DivisionalSecretariat[] {
    return district
        ? divisionalSecretariats.filter((ds) => ds.district === district)
        : divisionalSecretariats;
}

/* The divisional secretariat with this English or Sinhala name, looked up
   in the district when one is given */
export function findDivisionalSecretariat(
    name: string,
    district = "",
): DivisionalSecretariat | undefined {
    const wanted = comparable(name);

    return divisionalSecretariatsIn(district).find(
        (ds) =>
            comparable(ds.en) === wanted ||
            (ds.si !== undefined && comparable(ds.si) === wanted),
    );
}

/* Checks a facility's divisional secretariat against the list. Returns the
   English name to store, or an error. An empty value is allowed. */
export function checkDivisionalSecretariat(
    name: string,
    district: string,
): { name: string } | { error: string } {
    if (!name.trim()) {
        return { name: "" };
    }

    const match = findDivisionalSecretariat(name, district);
    if (match) {
        return { name: match.en };
    }

    return {
        error: district
            ? `"${name.trim()}" isn't a divisional secretariat in ${district} District. Choose one from the list.`
            : `"${name.trim()}" isn't a divisional secretariat. Choose one from the list.`,
    };
}

/* A stored divisional secretariat in the given language. Values that aren't
   in the list are shown as stored. */
export function localizedDivisionalSecretariat(
    name: string,
    locale: Locale,
): string {
    if (locale === defaultLocale) {
        return name;
    }

    return findDivisionalSecretariat(name)?.si ?? name;
}

/* The English names of the divisional secretariats whose English or
   Sinhala name contains the search text, so a search in either language
   finds the stored English name */
export function divisionalSecretariatsMatching(search: string): string[] {
    const wanted = comparable(search);
    if (!wanted) {
        return [];
    }

    return divisionalSecretariats
        .filter(
            (ds) =>
                comparable(ds.en).includes(wanted) ||
                (ds.si !== undefined && comparable(ds.si).includes(wanted)),
        )
        .map((ds) => ds.en);
}
