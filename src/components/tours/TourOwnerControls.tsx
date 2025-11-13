import { useTranslation } from "react-i18next";
import type { TourDetailsDto } from "@/types";
import { Button } from "@/components/ui/button";
import { InvitationForm } from "./InvitationForm";
import { InvitedUsersList } from "./InvitedUsersList";

interface TourOwnerControlsProps {
  tourId: string;
  tour: TourDetailsDto;
  onToggleVotingLock: () => void;
  isToggling: boolean;
}

/**
 * Tour owner controls component
 * Displays invitation management and voting lock controls
 * Only visible to tour owners
 */
export const TourOwnerControls = ({ tourId, tour, onToggleVotingLock, isToggling }: TourOwnerControlsProps) => {
  const { t } = useTranslation("tours");

  return (
    <>
      {/* Invitations Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">{t("tourDetails.invitations.title")}</h2>
          <InvitationForm tourId={tourId} />
          <div className="divider"></div>
          <InvitedUsersList tourId={tourId} isOwner={true} />
        </div>
      </div>

      {/* Voting Lock Controls */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {tour.voting_locked ? t("voting.unlockVoting") : t("voting.lockVoting")}
              </h3>
              <p className="text-sm text-base-content/60">
                {tour.voting_locked ? t("voting.votingLockedMessage") : "Allow participants to vote"}
              </p>
            </div>
            <Button
              variant={tour.voting_locked ? "error" : "neutral"}
              onClick={onToggleVotingLock}
              disabled={isToggling}
            >
              {isToggling
                ? "..."
                : tour.voting_locked
                  ? `🔓 ${t("voting.unlockVoting")}`
                  : `🔒 ${t("voting.lockVoting")}`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
