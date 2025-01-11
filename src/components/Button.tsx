import React, { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary";
type ButtonColor = "green" | "red" | "beige" | "black" | "transparent";

const buttonStyles: Record<ButtonColor, Record<ButtonVariant, String>> = {
    green: {
        primary: "bg-primary-green text-white hover:bg-primary-green-hover",
        secondary:
            "bg-secondary-green text-green-950 hover:bg-secondary-green-hover",
    },
    red: {
        primary: "bg-primary-red text-white hover:bg-primary-red-hover",
        secondary: "bg-secondary-red text-red-950 hover:bg-secondary-red-hover",
    },
    beige: {
        primary: "bg-primary-beige text-brown-950 hover:bg-primary-beige-hover",
        secondary:
            "bg-secondary-beige text-brown-950 hover:bg-secondary-beige-hover",
    },
    black: {
        primary: "bg-boh-black text-white hover:bg-boh-black-hover",
        secondary: "bg-secondary-gray text-black hover:bg-secondary-gray-hover",
    },
    transparent: {
        primary: "text-black",
        secondary: "text-white",
    },
};

type ButtonProps = ComponentProps<"button"> & {
    variant?: ButtonVariant;
    color?: ButtonColor;
};

export default function Button({
    variant = "primary",
    color = "green",
    className,
    ...props
}: ButtonProps) {
    const styleClasses = buttonStyles[color][variant];

    return (
        <button
            {...props}
            className={twMerge(
                `rounded-full px-4 py-2 font-encode-sans-sc font-semibold transition-all duration-300 ${styleClasses}`,
                className,
            )}
        />
    );
}
