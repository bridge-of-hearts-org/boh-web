import Button from "../components/Button";

export default function Home() {
    return (
        <div>
            <div className="m-10 grid grid-cols-[2fr,3fr] gap-8">
                <div>
                    <img
                        className="rounded-3xl"
                        src="images/hero-section-photo.jpg"
                    />
                </div>
                <div className="flex flex-col justify-center">
                    <div className="pb-5">
                        <p className="mb-2">
                            An online directory of child and elder care
                            institutions in Sri Lanka. The mission is to create
                            a comprehensive online directory that gets regularly
                            updated with up-to-date information about the
                            facilities.
                        </p>
                        <p>
                            This is still a work in progress. We are starting
                            with child care facilities. Will extend to elder
                            care soon.
                        </p>
                    </div>
                    <div>
                        <Button variant="primary" color="green">
                            View Directory
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
