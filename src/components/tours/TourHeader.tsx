import { useTranslation } from "react-i18next";
import type { TourDetailsDto } from "@/types";
import { Button } from "@/components/ui/button";

interface TourHeaderProps {
  tour: TourDetailsDto;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Tour header component displaying tour title, destination, dates, and details
 * Shows edit/delete buttons for tour owners
 */
export const TourHeader = ({ tour, isOwner, onEdit, onDelete }: TourHeaderProps) => {
  const { t } = useTranslation("tours");

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="card-title text-3xl">{tour.title}</h1>
            <p className="mt-2 text-lg text-base-content/70">
              📍{" "}
              <a href={tour.destination} target="_blank" rel="noopener noreferrer" className="link">
                {tour.destination}
              </a>
            </p>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Button variant="neutral-outline" onClick={onEdit}>
                {t("tourDetails.edit")}
              </Button>
              <Button variant="neutral-outline" onClick={onDelete} className="text-error">
                {t("tourDetails.delete")}
              </Button>
            </div>
          )}
        </div>

        <div className="divider"></div>

        {/* Tour Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-base-content/60">{t("tourDetails.startDate")}</p>
            <p className="text-lg font-semibold">{new Date(tour.start_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-base-content/60">{t("tourDetails.endDate")}</p>
            <p className="text-lg font-semibold">{new Date(tour.end_date).toLocaleDateString()}</p>
          </div>
          {tour.participant_limit && (
            <div>
              <p className="text-sm text-base-content/60">{t("tourDetails.participantLimit")}</p>
              <p className="text-lg font-semibold">{tour.participant_limit}</p>
            </div>
          )}
          {tour.like_threshold && (
            <div>
              <p className="text-sm text-base-content/60">{t("tourDetails.likeThreshold")}</p>
              <p className="text-lg font-semibold">{tour.like_threshold}</p>
            </div>
          )}
        </div>

        {tour.description && (
          <>
            <div className="divider"></div>
            <div>
              <p className="text-sm text-base-content/60">{t("tourDetails.description")}</p>
              <p className="mt-2 whitespace-pre-wrap">{tour.description}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
