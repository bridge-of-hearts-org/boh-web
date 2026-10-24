/* Placeholder shown in a map's place while it loads or when it can't be shown */
export default function MapMessage({
    text,
    pulse,
}: {
    text: string;
    pulse?: boolean;
}) {
    return (
        <div
            className={`flex h-full w-full items-center justify-center rounded-xl bg-gray-100 px-4 text-center text-sm text-gray-500 ${pulse ? "animate-pulse" : ""}`}
        >
            {text}
        </div>
    );
}
