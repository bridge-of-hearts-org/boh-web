import ImageComponent from "@/components/ImageComponent";
import HeroImage from "../../../public/images/children-silhouette.jpg";

export default function About() {
    return (
        <div>
            <div className="bg-gradient-to-r from-white/10 via-white/100 to-white/10 py-10">
                <h1 className="text-center font-encode-sans-sc text-xl font-bold">
                    About Us
                </h1>
            </div>
            <div className="flex justify-center p-10">
                <div className="flex flex-col items-center">
                    <ImageComponent
                        src={HeroImage}
                        placeholder="blur"
                        height={300}
                        title="Photo by Jess Zoerb on Unsplash"
                        alt="Sillhoutte of children playing on a field with a sunset in the background"
                    />
                </div>
            </div>
            <div className="flex flex-col gap-5 px-10 text-center lg:px-20">
                <p>
                    Bridge of Hearts is a volunteer-driven initiative dedicated
                    to creating a brighter future for children in Sri Lanka. Our
                    platform helps connect donors with children's homes across
                    island, ensuring that donations and resources are
                    distributed equitably to places that need them the most.
                </p>
                <p>
                    We started this project with a simple vision: to bridge the
                    gap between generosity and need. By providing a transparent
                    and comprehensive directory of children's homes, we aim to
                    empower donors to make informed decisions and support
                    facilities that are often overlooked.
                </p>
                <p>
                    We are continuously working to expand our reach, adding new
                    children's homes to the directory. Soon, we will have
                    information of all 350+ facilities in the island, ensuring
                    that no home, big or small, is left behind.
                </p>
                <p>
                    Together, we can create a network of hope, love, and
                    care—because every child deserves a chance.
                </p>
            </div>
        </div>
    );
}
