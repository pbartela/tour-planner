import { useTranslation } from "react-i18next";
import { formatDateByLocale } from "@/lib/services/date-formatter.service";
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
 * Shows edit/delete buttons for tour owners (except for archived tours)
 */
export const TourHeader = ({ tour, isOwner, onEdit, onDelete }: TourHeaderProps) => {
  const { t, i18n } = useTranslation("tours");
  const isArchived = tour.status === "archived";

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="card-title text-3xl">{tour.title}</h1>
              {isArchived && (
                <span className="badge badge-neutral gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
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
                  {t("tourDetails.archived")}
                </span>
              )}
            </div>
            <p className="mt-2 text-lg text-base-content/70">
              📍{" "}
              <a href={tour.destination} target="_blank" rel="noopener noreferrer" className="link">
                {tour.destination}
              </a>
            </p>
          </div>
          {isOwner && !isArchived && (
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

        {isArchived && (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>{t("tourDetails.archivedInfo")}</span>
          </div>
        )}

        <div className="divider"></div>

        {/* Tour Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-base-content/60">{t("tourDetails.startDate")}</p>
            <p className="text-lg font-semibold">{formatDateByLocale(new Date(tour.start_date), i18n.language)}</p>
          </div>
          <div>
            <p className="text-sm text-base-content/60">{t("tourDetails.endDate")}</p>
            <p className="text-lg font-semibold">{formatDateByLocale(new Date(tour.end_date), i18n.language)}</p>
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
