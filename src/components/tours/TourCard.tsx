import type { TourCardViewModel } from "@/types";

interface Props {
	tour: TourCardViewModel;
}

export const TourCard = ({ tour }: Props) => {
	return (
		<a
			href={tour.url}
			className="group block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
		>
			<div className="flex items-center justify-between">
				<h3 className="text-xl font-semibold tracking-tight group-hover:underline">{tour.title}</h3>
				{tour.hasNewActivity && (
					<span
						className="flex h-3 w-3 rounded-full bg-blue-500"
						aria-label="New activity"
					/>
				)}
			</div>
			<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{tour.dateRange}</p>
		</a>
	);
};
