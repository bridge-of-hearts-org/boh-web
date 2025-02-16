import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Card from "./Card";

type Breadcrumb = {
    text: string;
    link: string;
};

type BreadcrumbsPropsType = {
    hierarchy: Breadcrumb[];
};

export default function Breadcrumbs(props: BreadcrumbsPropsType) {
    return (
        <Card className="w-full">
            <div className="relative flex w-full items-center gap-2 overflow-hidden text-sm text-gray-600">
                <div className="start absolute right-0 grid h-full w-[100px] bg-gradient-to-l from-white/100 via-white/100 via-20% to-white/0"></div>
                {props.hierarchy.map((crumb, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <Link
                            href={crumb.link}
                            className="overflow-hidden text-nowrap p-1 font-encode-sans-sc font-semibold hover:text-black"
                        >
                            {crumb.text}
                        </Link>
                        {idx < props.hierarchy.length - 1 && <ChevronRight />}
                    </div>
                ))}
            </div>
        </Card>
    );
}
