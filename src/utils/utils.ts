export function removeKeys<T, K extends keyof T>(
    obj: T,
    keys: K[],
): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}

/* A signal that aborts after `ms`, and a function that cancels the timer.
   It aborts with the default "AbortError" reason rather than the
   "TimeoutError" AbortSignal.timeout uses, because @vercel/blob only stops
   retrying on an AbortError. */
export function abortAfter(ms: number): {
    signal: AbortSignal;
    cancel: () => void;
} {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);

    return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}
