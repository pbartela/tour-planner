import { useTranslation } from "react-i18next";
import type { InvitationByTokenDto } from "@/types";
import { Button } from "@/components/ui/button";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";

interface StateViewProps {
  onGoHome: () => void;
  isNavigating: boolean;
}

/**
 * Loading state view
 */
export const InvitationLoadingView = () => {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <SkeletonLoader />
    </div>
  );
};

/**
 * Error state view
 */
interface InvitationErrorViewProps extends StateViewProps {
  error: string;
}

export const InvitationErrorView = ({ error, onGoHome, isNavigating }: InvitationErrorViewProps) => {
  const { t } = useTranslation("tours");

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h1 className="card-title text-2xl justify-center">{t("invitations.errorTitle")}</h1>
          <p className="text-base-content/70">{error}</p>
          <div className="card-actions justify-center mt-4">
            <Button onClick={onGoHome} disabled={isNavigating}>
              {isNavigating ? t("common.redirecting") : t("invitations.goHome")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Expired or already processed invitation view
 */
interface InvitationExpiredViewProps extends StateViewProps {
  invitation: InvitationByTokenDto;
}

export const InvitationExpiredView = ({ invitation, onGoHome, isNavigating }: InvitationExpiredViewProps) => {
  const { t } = useTranslation("tours");

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
            <Button onClick={onGoHome} disabled={isNavigating}>
              {isNavigating ? t("common.redirecting") : t("invitations.goHome")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Email mismatch view
 */
interface InvitationEmailMismatchViewProps extends StateViewProps {
  invitation: InvitationByTokenDto;
  currentEmail: string;
}

export const InvitationEmailMismatchView = ({
  invitation,
  currentEmail,
  onGoHome,
  isNavigating,
}: InvitationEmailMismatchViewProps) => {
  const { t } = useTranslation("tours");

  return (
    <div className="text-center space-y-4">
      <div className="alert alert-error">
        <span>{t("invitations.emailMismatchStrict", { invitedEmail: invitation.email, currentEmail })}</span>
      </div>
      <p className="text-sm text-base-content/70">{t("invitations.emailMismatchInstructions")}</p>
      <Button onClick={onGoHome} disabled={isNavigating}>
        {isNavigating ? t("common.redirecting") : t("invitations.goHome")}
      </Button>
    </div>
  );
};
