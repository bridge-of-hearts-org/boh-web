type PropsType = {
    emails: string[];
};

export default function EmailList(props: PropsType) {
    return (
        <span>
            {props.emails.length == 0 && "-"}
            {props.emails.length > 0 && (
                <div className="flex flex-col gap-2">
                    {props.emails.map((email, idx) => {
                        return (
                            <span key={email}>
                                <a
                                    href={`mailto:${email}`}
                                    className="boh-link"
                                >
                                    {email}
                                </a>
                            </span>
                        );
                    })}
                </div>
            )}
        </span>
    );
}
