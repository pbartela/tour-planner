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

  const placeholderAvatars = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
  ];
  // Don't slice here - let AvatarGroup handle showing "+N more"
  const avatars =
    tour.participantAvatars && tour.participantAvatars.length > 0 ? tour.participantAvatars : placeholderAvatars;

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

          {/* Participant Avatars with Activity Indicator */}
          {(avatars.length > 0 || tour.hasNewActivity) && (
            <div className="flex items-center gap-2 mt-2">
              {avatars.length > 0 && <AvatarGroup avatars={avatars} maxVisible={3} />}
              <ActivityIndicator hasActivity={tour.hasNewActivity} label={t("tourList.newActivity")} />
            </div>
          )}
        </div>
      </Card>
    </a>
  );
};
