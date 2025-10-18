import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const EmptyState = () => {
  const { t } = useTranslation("tours");

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-y-4">
        <h3 className="text-2xl font-bold tracking-tight">{t("emptyState.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("emptyState.description")}</p>
        <a href="/tours/create">
          <Button>{t("emptyState.createTour")}</Button>
        </a>
      </div>
    </div>
  );
};
