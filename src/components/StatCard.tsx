import { StaticImageData } from "next/image";
import Card from "./Card";
import ImageComponent from "./ImageComponent";

type StatCardProps = {
    imageSrc: StaticImageData;
    imageAlt: string;
    statText: string;
};

export default function StatCard(props: StatCardProps) {
    return (
        <Card className="p-8">
            <div className="flex w-[280px] flex-col items-center gap-4">
                <ImageComponent
                    src={props.imageSrc}
                    sizes="280px"
                    height={230}
                    alt={props.imageAlt}
                />
                <p className="text-center">{props.statText}</p>
            </div>
        </Card>
    );
}
