import Image from "next/image";
import Button from "../components/Button";

export default function Home() {
    return (
        <div>
            {/* Hero Section */}
            <div className="m-10 flex flex-col items-center justify-center gap-10 lg:flex-row">
                <Image
                    className="rounded-3xl"
                    width={600}
                    height={0}
                    alt="Photo of three smiling children (AI generated)"
                    src="/images/hero-section-photo.jpg"
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
                        <Button variant="secondary" color="green">
                            View Directory
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stat section */}
            <div className="w-[100%] rounded-3xl bg-[#fff7ee] p-10">
                <div className="flex flex-wrap justify-center gap-4 xl:gap-8">
                    {/* Stat Card */}
                    <div className="rounded-3xl bg-white p-10 shadow-2xl">
                        <div className="flex w-[300px] flex-col items-center gap-4">
                            <Image
                                src="/images/facility-drone-image.jpg"
                                width={330}
                                height={230}
                                alt="Drone image of a building (AI generated)"
                                className="w-max-[100%] rounded-3xl"
                            />
                            <p className="text-center">
                                There are <b>379</b> child care facilities in
                                Sri Lanka, with over <b>10,000 children</b>*
                            </p>
                        </div>
                    </div>

                    {/* Stat Card */}
                    <div className="rounded-3xl bg-white p-10 shadow-2xl">
                        <div className="flex w-[300px] flex-col items-center gap-4">
                            <Image
                                src="/images/donation-boxes.jpg"
                                width={330}
                                height={230}
                                alt="Drone image of a building (AI generated)"
                                className="w-max-[100%] rounded-3xl"
                            />
                            <p className="text-center">
                                <b>60%</b> of child care facilities run on
                                external donations*
                            </p>
                        </div>
                    </div>

                    {/* Stat Card */}
                    <div className="rounded-3xl bg-white p-10 shadow-2xl">
                        <div className="flex w-[300px] flex-col items-center gap-4">
                            <Image
                                src="/images/smiling-children-2.jpg"
                                width={330}
                                height={230}
                                alt="Drone image of a building (AI generated)"
                                className="w-max-[100%] rounded-3xl"
                            />
                            <p className="text-center">
                                <b>71%</b> of the children are between ages
                                5-14*
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
