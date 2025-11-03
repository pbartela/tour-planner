import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { get, handleApiResponse } from "@/lib/client/api-client";
import type { InvitationByTokenDto } from "@/types";
import { useAcceptInvitationMutation, useDeclineInvitationMutation } from "@/lib/hooks/useInvitationMutations";

interface InviteAcceptanceViewProps {
  token: string;
  currentUserId?: string;
  userEmail?: string;
}

export const InviteAcceptanceView = ({ token, currentUserId, userEmail }: InviteAcceptanceViewProps) => {
  const { t } = useTranslation("tours");
  const [invitation, setInvitation] = useState<InvitationByTokenDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const acceptMutation = useAcceptInvitationMutation();
  const declineMutation = useDeclineInvitationMutation();

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await get(`/api/invitations?token=${encodeURIComponent(token)}`);
        const data = await handleApiResponse<InvitationByTokenDto>(response);
        setInvitation(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t("invitations.fetchError");
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token, t]);

  const handleAccept = async () => {
    if (!invitation || !currentUserId) return;

    try {
      const result = await acceptMutation.mutateAsync({
        invitationId: invitation.id,
        token: invitation.is_expired ? undefined : token,
      });

      toast.success(t("invitations.acceptSuccess"));
      // Redirect directly to tour details page
      window.location.href = `/tours/${result.tour_id}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("invitations.acceptError");
      toast.error(errorMessage);
    }
  };

  const handleDecline = async () => {
    if (!invitation || !currentUserId) return;

    // Confirmation dialog
    const confirmed = window.confirm(t("invitations.confirmDecline"));
    if (!confirmed) return;

    try {
      await declineMutation.mutateAsync({
        invitationId: invitation.id,
        token: invitation.is_expired ? undefined : token,
      });

      toast.success(t("invitations.declineSuccess"));
      // Redirect to dashboard
      window.location.href = "/";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("invitations.declineError");
      toast.error(errorMessage);
    }
  };

  const handleLogin = () => {
    // Redirect to login with redirect back to this invite page
    const inviteUrl = `/invite?token=${encodeURIComponent(token)}`;
    window.location.href = `/login?redirect=${encodeURIComponent(inviteUrl)}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <SkeletonLoader />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h1 className="card-title text-2xl justify-center">{t("invitations.errorTitle")}</h1>
            <p className="text-base-content/70">{error || t("invitations.notFound")}</p>
            <div className="card-actions justify-center mt-4">
              <Button onClick={() => (window.location.href = "/")}>{t("invitations.goHome")}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (invitation.is_expired || invitation.status !== "pending") {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h1 className="card-title text-2xl justify-center">{t("invitations.expiredTitle")}</h1>
            <p className="text-base-content/70">
              {invitation.is_expired
                ? t("invitations.expiredMessage")
                : t("invitations.alreadyProcessed", { status: invitation.status })}
            </p>
            <div className="card-actions justify-center mt-4">
              <Button onClick={() => (window.location.href = "/")}>{t("invitations.goHome")}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmailMatch = currentUserId && userEmail && userEmail.toLowerCase() === invitation.email.toLowerCase();
  const isLoggedIn = !!currentUserId;

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">{t("invitations.invitationTitle")}</h1>
          <div className="space-y-4">
            <div>
              <p className="text-base-content/70">{t("invitations.invitedBy")}</p>
              <p className="font-semibold">
                {invitation.inviter_display_name || invitation.inviter_email}
              </p>
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
            {isLoggedIn && isEmailMatch ? (
              <div className="flex gap-4">
                <Button
                  onClick={handleDecline}
                  disabled={declineMutation.isPending}
                  variant="outline"
                >
                  {declineMutation.isPending ? t("invitations.declining") : t("invitations.declineButton")}
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                  className="btn-primary"
                >
                  {acceptMutation.isPending ? t("invitations.accepting") : t("invitations.acceptButton")}
                </Button>
              </div>
            ) : isLoggedIn && !isEmailMatch ? (
              <div className="text-center space-y-4">
                <div className="alert alert-error">
                  <span>{t("invitations.emailMismatchStrict", { invitedEmail: invitation.email, currentEmail: userEmail })}</span>
                </div>
                <p className="text-sm text-base-content/70">{t("invitations.emailMismatchInstructions")}</p>
                <Button onClick={() => (window.location.href = "/")}>{t("invitations.goHome")}</Button>
              </div>
            ) : (
              <Button onClick={handleLogin} className="btn-primary">
                {t("invitations.loginButton")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

