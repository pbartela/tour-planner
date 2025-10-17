import { useTourList } from "@/lib/hooks/useTourList";
import type { TourCardViewModel, TourSummaryDto } from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { TourCard } from "@/components/tours/TourCard";

const formatDateRange = (startDate: string, endDate: string): string => {
	const start = new Date(startDate);
	const end = new Date(endDate);

	const options: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
	};

	const yearOption: Intl.DateTimeFormatOptions = {
		year: "numeric",
	};

	const startStr = start.toLocaleDateString("en-US", options);
	const endStr = end.toLocaleDateString("en-US", options);
	const yearStr = end.toLocaleDateString("en-US", yearOption);

	return `${startStr} - ${endStr}, ${yearStr}`;
};

const transformToViewModel = (dto: TourSummaryDto): TourCardViewModel => ({
	id: dto.id,
	url: `/tours/${dto.id}`,
	title: dto.title,
	dateRange: formatDateRange(dto.start_date, dto.end_date),
	hasNewActivity: dto.has_new_activity,
});

export const TourList = () => {
	const { data, isLoading, isError, error, refetch } = useTourList();

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<SkeletonLoader key={i} />
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="text-center">
				<p className="mb-4 text-red-500">Failed to load tours: {error.message}</p>
				<Button onClick={() => refetch()}>Retry</Button>
			</div>
		);
	}

	if (!data || data.data.length === 0) {
		return <EmptyState />;
	}

	const tours = data.data.map(transformToViewModel);

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{tours.map((tour) => (
				<TourCard key={tour.id} tour={tour} />
			))}
		</div>
	);
};

export default TourList;
