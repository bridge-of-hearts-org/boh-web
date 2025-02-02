type PropsType = {
    numbers: string[];
    orientation: "row" | "column";
};

export default function PhoneNumberList(props: PropsType) {
    return (
        <span>
            {props.numbers.length == 0 && "-"}
            {props.numbers.length > 0 && (
                <div
                    className={`flex gap-1 ${props.orientation == "column" ? "flex-col" : "flex-wrap"}`}
                >
                    {props.numbers.map((number, idx) => {
                        return (
                            <span key={number}>
                                <a
                                    href={`tel:${number}`}
                                    className="underline- hover:underline"
                                >
                                    {number.substring(0, 3) +
                                        "-" +
                                        number.substring(3)}
                                </a>
                                {props.orientation == "row" &&
                                    idx < props.numbers.length - 1 &&
                                    ", "}
                            </span>
                        );
                    })}
                </div>
            )}
        </span>
    );
}
