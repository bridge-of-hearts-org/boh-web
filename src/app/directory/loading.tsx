import { Loader } from "lucide-react";

export default function Loading() {
    return (
        <div className="mt-20 flex justify-center gap-2">
            <Loader />
            <div>Loading...</div>
        </div>
    );
}
