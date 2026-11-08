/* The minimal translator shape used here, so this module doesn't depend on
   next-intl and can be unit tested with a stub */
type Translator = {
    (key: string): string;
    has(key: string): boolean;
};

/* A database value (e.g. a district name) in the current language, or the
   value itself when there is no translation for it */
export function translatedValue(t: Translator, value: string): string {
    if (value && t.has(value)) {
        return t(value);
    }

    return value;
}
