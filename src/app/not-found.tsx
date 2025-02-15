import Button from "@/components/Button";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="mt-10 flex flex-col items-center justify-center gap-10">
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <Link href="/">
                <Button name="Return Home" variant="secondary" color="black">
                    Return Home
                </Button>
            </Link>
        </div>
    );
}
