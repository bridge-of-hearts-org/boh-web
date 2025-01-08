import Button from "./Button";

export default function MenuBar() {
    return (
        <div
            id="header"
            className="bg-boh-black p-4 shadow-gray-400 shadow-lg flex justify-between items-center"
        >
            <div className="">
                <img
                    className="h-[25px]"
                    src="/images/logo-dark-middle.png"
                    alt="Bridge of Hearts Logo"
                />
            </div>
            <div className="text-white flex gap-3 mr-4">
                <Button variant="secondary" color="transparent">
                    Home
                </Button>
                <Button variant="secondary" color="transparent">
                    Directory
                </Button>
                <Button variant="secondary" color="transparent">
                    About
                </Button>
                <Button variant="secondary" color="transparent">
                    Contact
                </Button>
            </div>
        </div>
    );
}
