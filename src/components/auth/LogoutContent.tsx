import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

import { AuthHeader } from "./AuthHeader";

export const LogoutContent = () => {
  const { t, i18n } = useTranslation("auth");
  const locale = i18n.language;

  return (
    <>
      <AuthHeader title={t("logout.title")} description={t("logout.description")} />
      <div className="mt-4 flex flex-col items-center gap-4 px-4 py-3">
        <div className="flex w-full flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              window.location.href = `/${locale}`;
            }}
          >
            {t("logout.backToHome")}
          </Button>
          <Button
            variant="neutral-outline"
            size="lg"
            className="w-full"
            onClick={() => {
              window.location.href = `/${locale}/login`;
            }}
          >
            {t("logout.signInAgain")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default LogoutContent;
