import Button from "./Button";

export default function MenuBar() {
    return (
        <div
            id="header"
            className="flex items-center justify-between bg-boh-black p-4 shadow-lg shadow-gray-400"
        >
            <div className="flex-shrink-0">
                <img
                    className="w-[220px]"
                    src="/images/logo-dark-middle.png"
                    alt="Bridge of Hearts Logo"
                />
            </div>
            <div className="mr-4 flex gap-3 text-white">
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
