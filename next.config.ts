import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "hzhlx0obnpowbirz.public.blob.vercel-storage.com",
            },
        ],
    },
    async redirects() {
        return [
            {
                source: "/facility/67a7d57aed8ae65f4becd42e",
                destination: "/facility/st-john-childrens-home-moratuwa",
                permanent: true,
            },
            {
                source: "/facility/67a7d57aed8ae65f4becd431",
                destination: "/facility/leela-jayasekara-childrens-home-lunawa",
                permanent: true,
            },
            {
                source: "/facility/67a7d57aed8ae65f4becd434",
                destination:
                    "/facility/vajira-sri-boys-childrens-home-pitakotte",
                permanent: true,
            },
            {
                source: "/facility/67a7d57aed8ae65f4becd430",
                destination:
                    "/facility/gangodawila-balika-childrens-home-nugegoda",
                permanent: true,
            },
            {
                source: "/facility/67a7d57aed8ae65f4becd432",
                destination: "/facility/gunasekara-childrens-home-nawala",
                permanent: true,
            },
            {
                source: "/facility/67a7d57aed8ae65f4becd433",
                destination: "/facility/sneha-childrens-home-bambalapitiye",
                permanent: true,
            },
            {
                source: "/facility/67a7d57aed8ae65f4becd438",
                destination: "/facility/maha-bodhi-childrens-home-meegoda",
                permanent: true,
            },
            {
                source: "/facility/67a7d57bed8ae65f4becd439",
                destination:
                    "/facility/kumara-kashyapa-childrens-home-mulleriyawa",
                permanent: true,
            },
            {
                source: "/facility/67a7d57aed8ae65f4becd437",
                destination:
                    "/facility/sarvodaya-suwasetha-nutritional-center-rawatawatta",
                permanent: true,
            },
            {
                source: "/facility/67a7d57bed8ae65f4becd43b",
                destination:
                    "/facility/suwasetha-balika-childrens-home-kosgama",
                permanent: true,
            },
            {
                source: "/facility/67a7d57bed8ae65f4becd43c",
                destination: "/facility/noguchi-childrens-home-boralesgamuwa",
                permanent: true,
            },
            {
                source: "/facility/67a7d57ced8ae65f4becd440",
                destination: "/facility/rukmale-balika-nivasaya-pannipitiya",
                permanent: true,
            },
            {
                source: "/facility/67a7d57bed8ae65f4becd43f",
                destination: "/facility/prem-childrens-home-rawatawatta",
                permanent: true,
            },
            {
                source: "/facility/67a7d57bed8ae65f4becd43d",
                destination:
                    "/facility/sucharithodaya-childrens-home-maharagama",
                permanent: true,
            },
            {
                source: "/facility/67a7d57bed8ae65f4becd43e",
                destination:
                    "/facility/muslim-balika-childrens-home-kirulapona",
                permanent: true,
            },
            {
                source: "/facility/67a7d57ced8ae65f4becd443",
                destination: "/facility/shilpa-childrens-home-narahenpita",
                permanent: true,
            },
            {
                source: "/facility/67a7d57ced8ae65f4becd441",
                destination:
                    "/facility/mawupiya-sewana-childrens-homes-pannipitiya",
                permanent: true,
            },
            {
                source: "/facility/67a7d57ced8ae65f4becd442",
                destination:
                    "/facility/sinha-salsevana-childrens-home-mattegoda",
                permanent: true,
            },
            {
                source: "/facility/67a7d57aed8ae65f4becd436",
                destination:
                    "/facility/sri-sangamitta-girls-childrens-home-pamankada",
                permanent: true,
            },
            {
                source: "/facility/67a921c50d0eb5bc29f6ec40",
                destination: "/facility/sos-childrens-village-piliyandala",
                permanent: true,
            },
            {
                source: "/facility/67a921c60d0eb5bc29f6ec41",
                destination:
                    "/facility/sri-lankadara-childrens-home-wellawatta",
                permanent: true,
            },
            {
                source: "/facility/67b12f63613b86c293bdb83d",
                destination: "/facility/ma-sewana-childrens-home-lunawa",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
