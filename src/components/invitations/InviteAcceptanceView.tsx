import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInvitationAcceptance } from "@/lib/hooks/useInvitationAcceptance";
import {
  InvitationLoadingView,
  InvitationErrorView,
  InvitationExpiredView,
  InvitationEmailMismatchView,
} from "./InvitationStateViews";

interface InviteAcceptanceViewProps {
  token: string;
  currentUserId: string;
  userEmail: string;
}

/**
 * Invitation acceptance view component
 * Uses custom hook with reducer pattern for state management
 * Separated into sub-components for different states
 */
export const InviteAcceptanceView = ({
  token,
  currentUserId: _currentUserId,
  userEmail,
}: InviteAcceptanceViewProps) => {
  const { t } = useTranslation("tours");
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const { state, isEmailMatch, isExpiredOrProcessed, isProcessing, actions } = useInvitationAcceptance(
    token,
    userEmail
  );

  const isNavigating = state.status === "navigating";

  // Handle different states
  if (state.status === "loading") {
    return <InvitationLoadingView />;
  }

  if (state.status === "error") {
    return <InvitationErrorView error={state.error} onGoHome={actions.handleGoHome} isNavigating={isNavigating} />;
  }

  if (state.status === "success" && isExpiredOrProcessed) {
    return (
      <InvitationExpiredView
        invitation={state.invitation}
        onGoHome={actions.handleGoHome}
        isNavigating={isNavigating}
      />
    );
  }

  // At this point, we have a valid pending invitation
  if (state.status !== "success") return null;

  const { invitation } = state;

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">{t("invitations.invitationTitle")}</h1>
          <div className="space-y-4">
            <div>
              <p className="text-base-content/70">{t("invitations.invitedBy")}</p>
              <p className="font-semibold">{invitation.inviter_display_name || invitation.inviter_email}</p>
            </div>
            <div>
              <p className="text-base-content/70">{t("invitations.tourTitle")}</p>
              <p className="font-semibold text-lg">{invitation.tour_title}</p>
            </div>
            <div>
              <p className="text-base-content/70">{t("invitations.invitedEmail")}</p>
              <p className="font-medium">{invitation.email}</p>
            </div>
          </div>

          <div className="card-actions justify-center mt-6">
            {isEmailMatch ? (
              <div className="flex gap-4">
                <Button
                  onClick={() => setDeclineDialogOpen(true)}
                  disabled={isProcessing || isNavigating}
                  variant="neutral-outline"
                >
                  {t("invitations.declineButton")}
                </Button>
                <Button onClick={actions.handleAccept} disabled={isProcessing || isNavigating} variant="primary">
                  {isNavigating ? t("common.redirecting") : t("invitations.acceptButton")}
                </Button>
              </div>
            ) : (
              <InvitationEmailMismatchView
                invitation={invitation}
                currentEmail={userEmail}
                onGoHome={actions.handleGoHome}
                isNavigating={isNavigating}
              />
            )}
          </div>
        </div>
      </div>

      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("invitations.declineTitle")}</DialogTitle>
            <DialogDescription>{t("invitations.confirmDecline")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="neutral-outline" onClick={() => setDeclineDialogOpen(false)} disabled={isProcessing}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="error"
              onClick={async () => {
                await actions.handleDecline();
                setDeclineDialogOpen(false);
              }}
              disabled={isProcessing}
            >
              {isNavigating ? t("common.redirecting") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
