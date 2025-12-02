import { useState } from "react";
import { useTourList } from "@/lib/hooks/useTourList";
import type { TourCardViewModel, TourSummaryDto } from "@/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { TourCard } from "@/components/tours/TourCard";
import { useTranslation } from "react-i18next";

interface TourListProps {
  onAddTripClick?: () => void;
}

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
  imageUrl: dto.metadata?.image,
  participantAvatars: dto.participant_avatars,
  status: dto.status,
});

export const TourList = ({ onAddTripClick }: TourListProps = {}) => {
  const { t, i18n } = useTranslation("tours");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const { data, isLoading, isError, error, refetch } = useTourList({ status: activeTab });

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

  const tours = data ? data.data.map((tour) => transformToViewModel(tour, i18n.language)) : [];
  const showEmptyState = !isLoading && tours.length === 0;

  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <div className="tabs tabs-boxed bg-base-200">
        <button className={`tab ${activeTab === "active" ? "tab-active" : ""}`} onClick={() => setActiveTab("active")}>
          {t("tourList.tabs.active")}
        </button>
        <button
          className={`tab ${activeTab === "archived" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("archived")}
        >
          {t("tourList.tabs.archived")}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLoader key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {showEmptyState && activeTab === "active" && <EmptyState onCreateTourClick={onAddTripClick} />}

      {showEmptyState && activeTab === "archived" && (
        <div className="text-center py-12">
          <div className="text-base-content/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <p className="text-lg font-medium">{t("tourList.noArchivedTours")}</p>
            <p className="text-sm mt-2">{t("tourList.archivedToursInfo")}</p>
          </div>
        </div>
      )}

      {/* Tour Grid */}
      {!isLoading && tours.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) for adding new trips - only show on active tab */}
      {onAddTripClick && activeTab === "active" && (
        <button
          onClick={onAddTripClick}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-content shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label={t("addTrip.title")}
          title={t("addTrip.title")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TourList;
