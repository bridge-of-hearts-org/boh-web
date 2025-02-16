import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type CardProps = ComponentProps<"div">;

export default function Card({ className, ...props }: CardProps) {
    return (
        <div
            {...props}
            className={twMerge(
                "rounded-3xl border border-gray-300 bg-white p-5 shadow-sm",
                className,
            )}
        ></div>
    );
}
