import React, { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary";
type ButtonColor = "green" | "red" | "beige" | "black" | "transparent";

const getButtonStyles = (
    color: ButtonColor,
    variant: ButtonVariant,
    disabled?: boolean,
): string => {
    if (color === "green") {
        if (variant === "primary") {
            return `bg-primary-green text-white ${disabled ? "" : "hover:bg-primary-green-hover"}`;
        } else if (variant === "secondary") {
            return `bg-secondary-green text-green-950 ${disabled ? "" : "hover:bg-secondary-green-hover"}`;
        }
    } else if (color === "red") {
        if (variant === "primary") {
            return `bg-primary-red text-white ${disabled ? "" : "hover:bg-primary-red-hover"}`;
        } else if (variant === "secondary")
            return `bg-secondary-red text-red-950 ${disabled ? "" : "hover:bg-secondary-red-hover"}`;
    } else if (color === "beige") {
        if (variant === "primary") {
            return `bg-primary-beige text-brown-950 ${disabled ? "" : "hover:bg-primary-beige-hover"}`;
        } else if (variant === "secondary") {
            return `bg-secondary-beige text-brown-950 ${disabled ? "" : "hover:bg-secondary-beige-hover"}`;
        }
    } else if (color === "black") {
        if (variant === "primary") {
            return `bg-boh-black text-white ${disabled ? "" : "hover:bg-boh-black-hover"}`;
        } else if (variant === "secondary") {
            return `bg-secondary-gray text-black ${disabled ? "" : "hover:bg-secondary-gray-hover"}`;
        }
    } else if (color === "transparent") {
        if (variant === "primary") {
            return `text-black`;
        } else if (variant === "secondary") {
            return `text-white`;
        }
    }

    return "";
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
    const styleClasses = getButtonStyles(color, variant, props.disabled);

    return (
        <button
            {...props}
            className={twMerge(
                `rounded-full px-4 py-2 font-encode-sans-sc font-semibold transition-all duration-100 ${styleClasses}`,
                className,
            )}
        />
    );
}
