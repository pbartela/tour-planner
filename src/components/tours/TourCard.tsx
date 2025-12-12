import type { TourCardViewModel } from "@/types";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { ActivityIndicator } from "@/components/ui/ActivityIndicator";

interface Props {
  tour: TourCardViewModel;
}

export const TourCard = ({ tour }: Props) => {
  const { t } = useTranslation("tours");

  const imageUrl = tour.imageUrl || "";
  const isArchived = tour.status === "archived";

  return (
    <a href={tour.url} className="group block">
      <Card
        variant="elevated"
        className={`flex flex-col overflow-hidden transition-all hover:shadow-lg ${isArchived ? "opacity-80" : ""}`}
      >
        {/* Image with Archived Badge */}
        <figure className="w-full aspect-video overflow-hidden bg-center bg-cover bg-no-repeat rounded-t-xl relative">
          <div
            className={`w-full h-full bg-center bg-cover bg-no-repeat ${isArchived ? "grayscale" : ""}`}
            style={{ backgroundImage: `url(${imageUrl})` }}
            role="img"
            aria-label={`${tour.title} cover image`}
          />
          {isArchived && (
            <div className="absolute top-2 right-2">
              <span className="badge badge-neutral badge-sm shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                {t("tourCard.archived")}
              </span>
            </div>
          )}
        </figure>

        {/* Content */}
        <div className="flex w-full flex-col gap-2 p-4">
          <div>
            {/* Location */}
            <p className="mb-1 text-sm font-normal leading-normal text-base-content/60">{tour.destination}</p>

            {/* Title */}
            <h3
              className={`mb-1 text-lg font-bold leading-tight tracking-[-0.015em] text-base-content group-hover:underline ${isArchived ? "text-base-content/70" : ""}`}
            >
              {tour.title}
            </h3>

            {/* Date Range */}
            <p className="text-base font-normal leading-normal text-base-content/60">{tour.dateRange}</p>
          </div>

          {/* Participant Avatars with Activity Indicator */}
          {((tour.participants && tour.participants.length > 0) || tour.hasNewActivity) && (
            <div className="flex items-center gap-2 mt-2">
              {tour.participants && tour.participants.length > 0 && (
                <AvatarGroup participants={tour.participants} maxVisible={3} anonymousLabel={t("tourCard.anonymous")} />
              )}
              {!isArchived && <ActivityIndicator hasActivity={tour.hasNewActivity} label={t("tourList.newActivity")} />}
            </div>
          )}
        </div>
      </Card>
    </a>
  );
};
