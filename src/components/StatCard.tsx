import Card from "./Card";
import ImageComponent from "./ImageComponent";

type StatCardProps = {
    imageSrc: string;
    statText: string;
};

export default function StatCard(props: StatCardProps) {
    return (
        <Card className="p-8">
            <div className="flex w-[280px] flex-col items-center gap-4">
                <ImageComponent
                    imageSrc={props.imageSrc}
                    containerClasses="w-[90%] h-[230px]"
                    imageClasses="object-cover"
                    imageSizes="280px"
                />
                <p className="text-center">{props.statText}</p>
            </div>
        </Card>
    );
}
