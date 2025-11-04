import type { TourCardViewModel } from "@/types";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";

interface Props {
  tour: TourCardViewModel;
}

export const TourCard = ({ tour }: Props) => {
  const { t } = useTranslation("tours");

  const imageUrl = tour.imageUrl || "";

  const placeholderAvatars = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
  ];
  const avatars =
    tour.participantAvatars && tour.participantAvatars.length > 0
      ? tour.participantAvatars.slice(0, 3)
      : placeholderAvatars;

  return (
    <a href={tour.url} className="group block">
      <Card variant="elevated" className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
        {/* Image */}
        <figure className="w-full aspect-video overflow-hidden bg-center bg-cover bg-no-repeat rounded-t-xl">
          <div
            className="w-full h-full bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(${imageUrl})` }}
            role="img"
            aria-label={`${tour.title} cover image`}
          />
        </figure>

        {/* Content */}
        <div className="flex w-full flex-col gap-2 p-4">
          <div>
            {/* Location */}
            <p className="mb-1 text-sm font-normal leading-normal text-base-content/60">{tour.destination}</p>

            {/* Title */}
            <h3 className="mb-1 text-lg font-bold leading-tight tracking-[-0.015em] text-base-content group-hover:underline">
              {tour.title}
            </h3>

            {/* Date Range */}
            <p className="text-base font-normal leading-normal text-base-content/60">{tour.dateRange}</p>
          </div>

          {/* Participant Avatars */}
          {avatars.length > 0 && (
            <div className="flex items-center justify-start mt-2">
              <div className="flex -space-x-3">
                {avatars.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar}
                    alt={`Participant ${index + 1}`}
                    className="h-9 w-9 rounded-full border-2 border-base-100 dark:border-base-300 object-cover"
                  />
                ))}
              </div>
              {tour.hasNewActivity && (
                <span
                  className="ml-2 flex h-3 w-3 rounded-full bg-primary"
                  aria-label={t("tourList.newActivity")}
                  title={t("tourList.newActivity")}
                />
              )}
            </div>
          )}

          {/* New Activity Indicator (if no avatars) */}
          {avatars.length === 0 && tour.hasNewActivity && (
            <div className="flex items-center justify-start mt-2">
              <span
                className="flex h-3 w-3 rounded-full bg-primary"
                aria-label={t("tourList.newActivity")}
                title={t("tourList.newActivity")}
              />
            </div>
          )}
        </div>
      </Card>
    </a>
  );
};
