/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        fontFamily: {
            "encode-sans": ["Encode Sans", "sans-serif"],
            "encode-sans-sc": ["Encode Sans SC", "sans-serif"],
        },
        extend: {
            colors: {
                "primary-red": "#930000",
                "primary-red-hover": "#c13a3a",
                "secondary-red": "#F0C7C7",
                "secondary-red-hover": "#e1a8a8",
                "primary-green": "#606E55",
                "primary-green-hover": "rgb(130, 150, 115)",
                "secondary-green": "#DBE5D3",
                "secondary-green-hover": "#c1cfb5",
                "primary-beige": "#F9CA86",
                "primary-beige-hover": "#ddb987",
                "secondary-beige": "#FFECD0",
                "secondary-beige-hover": "#e4cfae",
                "primary-gray": "#B2B2B2",
                "secondary-gray": "#E4E4E4",
                "secondary-gray-hover": "#cbcbcb",
                "boh-white": "#FFF9F2",
                "boh-white-hover": "#f1e1d0",
                "boh-black": "#02040F",
                "boh-black-hover": "#3d3d3e",
            },
        },
    },
    plugins: [],
};
