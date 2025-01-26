import { Loader } from "lucide-react";

export default function LoadingSpinner() {
    return (
        <div className="mt-20 flex justify-center gap-2">
            <div className="flex aspect-square animate-spin items-center justify-center">
                <Loader />
            </div>
            <div className="text-xl font-semibold">Loading...</div>
        </div>
    );
}
