import { Loader } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex h-12 w-12 animate-spin items-center justify-center">
                <Loader />
            </div>
        </div>
    );
}
