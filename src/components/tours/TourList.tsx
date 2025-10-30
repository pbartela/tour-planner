import { useTourList } from "@/lib/hooks/useTourList";
import type { TourCardViewModel, TourSummaryDto } from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { TourCard } from "@/components/tours/TourCard";
import { useTranslation } from "react-i18next";

const formatDateRange = (startDate: string, endDate: string, locale: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  const yearOption: Intl.DateTimeFormatOptions = {
    year: "numeric",
  };

  const startStr = start.toLocaleDateString(locale, options);
  const endStr = end.toLocaleDateString(locale, options);
  const yearStr = end.toLocaleDateString(locale, yearOption);

  return `${startStr} - ${endStr}, ${yearStr}`;
};

const transformToViewModel = (dto: TourSummaryDto, locale: string): TourCardViewModel => ({
  id: dto.id,
  url: `/tours/${dto.id}`,
  title: dto.title,
  destination: dto.destination,
  dateRange: formatDateRange(dto.start_date, dto.end_date, locale),
  hasNewActivity: dto.has_new_activity,
  imageUrl: undefined, // Can be added to DTO later
  participantAvatars: undefined, // Can be fetched separately if needed
});

export const TourList = () => {
  const { t, i18n } = useTranslation("tours");
  const { data, isLoading, isError, error, refetch } = useTourList();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center">
        <p className="mb-4 text-red-500">
          {t("tourList.loadingError")}: {error.message}
        </p>
        <Button onClick={() => refetch()}>{t("tourList.retry")}</Button>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return <EmptyState />;
  }

  const tours = data.data.map((tour) => transformToViewModel(tour, i18n.language));

  return (
    <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 lg:grid-cols-3">
      {tours.map((tour) => (
        <TourCard key={tour.id} tour={tour} />
      ))}
    </div>
  );
};

export default TourList;
