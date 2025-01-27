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
                />
                <div className="flex flex-col justify-center gap-5">
                    <div className="flex flex-col items-center gap-5 text-center text-lg">
                        <div>
                            <p className="mb-2 text-center font-encode-sans-sc text-3xl font-semibold">
                                Welcome to Bridge of Hearts
                            </p>
                            <p className="mb-2 text-center text-xl font-semibold">
                                An online directory for child and elder care
                                facilities in Sri Lanka.
                            </p>
                        </div>
                        <div className="flex max-w-[600px] flex-col gap-5">
                            <p>
                                Our mission is to provide a reliable, regularly
                                updated resource with comprehensive information
                                about these essential institutions.
                            </p>
                            <p>
                                We are currently focusing on child care
                                facilities as we build the foundation of this
                                project, with plans to expand to elder care in
                                the near future.
                            </p>
                            <p>
                                Together, let's bridge hearts and connect
                                communities
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
                        statText="There are 4,000+ child care facilities in Sri Lanka"
                    />
                    <StatCard
                        imageSrc="/images/donation-boxes.jpg"
                        statText="60% of child care facilities run on external donations"
                    />
                    <StatCard
                        imageSrc="/images/smiling-children-2.jpg"
                        statText="71% of the children are between ages 5-14"
                    />
                </div>
            </div>
        </div>
    );
}
