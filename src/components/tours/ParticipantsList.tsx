import { useTranslation } from "react-i18next";
import { useParticipants } from "@/lib/hooks/useParticipants";
import { Avatar } from "@/components/ui/Avatar";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { formatDate } from "@/lib/utils/date-formatters";

interface ParticipantsListProps {
  tourId: string;
  ownerId: string;
}

/**
 * Component for displaying the list of tour participants with avatars
 * Shows all users who have joined the tour (accepted invitations)
 */
export const ParticipantsList = ({ tourId, ownerId }: ParticipantsListProps) => {
  const { t } = useTranslation("tours");
  const { data: participants, isLoading, isError, error } = useParticipants(tourId);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (isError) {
    return (
      <div className="alert alert-error">
        <span>
          {t("participants.loadError")}: {error?.message || t("participants.unknownError")}
        </span>
      </div>
    );
  }

  if (!participants || participants.length === 0) {
    return <div className="text-base-content/70 text-sm">{t("participants.noParticipants")}</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">
        {t("participants.title")} ({participants.length})
      </h3>
      <ul className="space-y-2">
        {participants.map((participant) => {
          const isOwner = participant.user_id === ownerId;
          const displayName = participant.display_name || t("participants.unknownUser");

          return (
            <li key={participant.user_id} className="flex items-center gap-3 p-2 bg-base-200 rounded-lg">
              <Avatar src={participant.avatar_url} alt={displayName} size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{displayName}</span>
                  {isOwner && <span className="badge badge-primary badge-sm">{t("participants.owner")}</span>}
                </div>
                <div className="text-xs text-base-content/60">
                  {t("participants.joinedOn")} {formatDate(participant.joined_at)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
