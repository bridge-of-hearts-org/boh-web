import Button from "../components/Button";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import ImageComponent from "@/components/ImageComponent";

export default function HomePage() {
    return (
        <div className="">
            {/* Hero Section */}
            <div className="m-10 flex flex-col items-center justify-center gap-10 lg:flex-row">
                <ImageComponent
                    imageSrc="/images/hero-section-photo.jpg"
                    containerClasses="w-full h-[400px] max-w-[600px]"
                    imageClasses="object-cover"
                    imageSizes="600px"
                    alt="Three children smiling happily at the camera"
                />
                <div className="flex flex-col justify-center gap-5">
                    <div className="flex flex-col items-center gap-5 text-center text-lg">
                        <div>
                            <h1 className="mb-2 text-center font-encode-sans-sc text-3xl font-semibold">
                                Welcome to Bridge of Hearts
                            </h1>
                            <h2 className="mb-2 text-center text-xl font-semibold">
                                An online directory for Child Development
                                Centers in Sri Lanka.
                            </h2>
                        </div>
                        <div className="flex max-w-[600px] flex-col gap-5">
                            <p>
                                There are more than 300 Child Development
                                Centers, commonly known as Children's Homes in
                                Sri Lanka, with more than 10,000 children.
                            </p>
                            <p>
                                Our mission is to provide a reliable, regularly
                                updated resource with comprehensive information
                                about these facilities, so that donors can find
                                the places that are most in need.
                            </p>
                            <p>
                                Together, let's bridge hearts and connect
                                communities.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <Link href="/directory">
                            <Button variant="secondary" color="green">
                                View Directory
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stat section */}
            <div className="mb-10 w-[100%] rounded-3xl bg-[#f0e7df] p-10">
                <div className="flex flex-wrap justify-center gap-4 xl:gap-8">
                    {/* Stat Card */}
                    <StatCard
                        imageSrc="/images/facility-drone-image.jpg"
                        imageAlt="An aerial view of a children's home, with a playground in front of it, where children are playing"
                        statText="There are 4,000+ child care facilities in Sri Lanka"
                    />
                    <StatCard
                        imageSrc="/images/donation-boxes.jpg"
                        imageAlt="Three boxes of donations, with clothes, food and stationery supplies"
                        statText="60% of child care facilities run on external donations"
                    />
                    <StatCard
                        imageSrc="/images/smiling-children-2.jpg"
                        imageAlt="Children in school uniforms smiling at the camera"
                        statText="71% of the children are between ages 5-14"
                    />
                </div>
            </div>
        </div>
    );
}
