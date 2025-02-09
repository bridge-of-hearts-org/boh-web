"use client";
import { useRouter, useSearchParams } from "next/navigation";

import Button from "@/components/Button";

type NavigationProps = {
    totalPages: number;
};

export default function NavigationBar(props: NavigationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentPage = searchParams.get("page") || 1;

    const handleClick = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());

        router.push(`/directory/?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="flex gap-5">
            {props.totalPages > 1 &&
                Array.from({ length: props.totalPages }, (_, i) => (
                    <Button
                        key={i + 1}
                        variant="secondary"
                        color="black"
                        disabled={currentPage == i + 1}
                        className={`${currentPage == i + 1 ? "border-2 border-gray-400 bg-gray-50 shadow-none" : "bg-white shadow-md"}`}
                        onClick={() => handleClick(i + 1)}
                    >
                        {i + 1}
                    </Button>
                ))}
        </div>
    );
}
