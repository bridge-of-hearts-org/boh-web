import ImageComponent from "@/components/ImageComponent";
import VolunteerIcon from "../../../public/images/volunteer-hands-icon.png";
import ChildrenIcon from "../../../public/images/children-icon.png";
import DonationIcon from "../../../public/images/donation-icon.png";
import Link from "next/link";

export default function About() {
    return (
        <div className="flex flex-col items-center">
            <div className="mb-10 bg-gradient-to-r from-white/10 via-orange-100/50 to-white/10 py-10">
                <h1 className="text-center font-encode-sans-sc text-xl font-bold">
                    About Us
                </h1>
            </div>
            <div className="flex flex-col items-center gap-5 px-10 text-justify lg:w-2/3 lg:px-20">
                <div className="mt-5 flex justify-center">
                    <ImageComponent
                        src={VolunteerIcon}
                        height={100}
                        sizes="100px"
                        alt="Three hands holding each other"
                        title="Icon created by Freepik - Flaticon"
                        className="object-contain"
                    />
                </div>
                <p>
                    <strong>Bridge of Hearts</strong> is a volunteer-driven
                    initiative dedicated to creating a brighter future for
                    children in Sri Lanka. Our platform connects donors with
                    children's homes across the island, ensuring that donations
                    and resources are distributed equitably to the places that
                    need them the most.
                </p>
                <div className="mt-8 flex justify-center">
                    <ImageComponent
                        src={ChildrenIcon}
                        height={100}
                        sizes="100px"
                        alt="Three hands holding each other"
                        title="Children icons created by Freepik - Flaticon"
                        className="object-contain"
                    />
                </div>
                <div className="flex flex-col gap-5">
                    <p>
                        We started this project with a simple vision: to bridge
                        the gap between generosity and need. By providing a
                        transparent and comprehensive directory of children's
                        homes, we aim to empower donors to make informed
                        decisions and support the facilities that are often
                        overlooked.
                    </p>
                    <p>
                        It is our intention to continuously expand our reach by
                        adding new children's homes to the directory. Soon, we
                        will have information on all{" "}
                        <strong>350+ facilities</strong> across the island,
                        ensuring that no home, big or small, is left behind.
                    </p>
                </div>
                <div className="mt-8 flex justify-center">
                    <ImageComponent
                        src={DonationIcon}
                        height={100}
                        sizes="100px"
                        alt="Three hands holding each other"
                        title="Food donation icons created by iconixarPro - Flaticon"
                        className="object-contain"
                    />
                </div>
                <p>
                    Together, we're working to change the landscape of child
                    care donations in Sri Lanka. While the most well-known
                    facilities receive the majority of support, our platform
                    ensures that every child—no matter where they live—has the
                    opportunity to thrive. We are{" "}
                    <strong>actively expanding</strong> our reach to include
                    data from all 9 provinces, starting with the Western
                    Province, so that no child is left behind.
                </p>
                <p className="mt-8 text-center">
                    <Link href="/directory" className="boh-link">
                        Explore our directory of Child Development Centres
                        (Children's Homes) in Sri Lanka.
                    </Link>
                </p>
            </div>
        </div>
    );
}
