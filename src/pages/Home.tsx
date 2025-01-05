import React from "react";

export default function Home() {
    return (
        <div
            id="header"
            className="bg-black p-4 shadow-xl flex justify-between"
        >
            <div className="">
                <img
                    className="w-[300px]"
                    src="/images/logo-dark-middle.png"
                    alt="Bridge of Hearts Logo"
                />
            </div>
            <div className="text-white flex gap-10 pt-1">
                <div>Home</div>
                <div>Directory</div>
                <div>About</div>
                <div>Contact</div>
            </div>
        </div>
    );
}
