import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  onCreateTourClick?: () => void;
}

export const EmptyState = ({ onCreateTourClick }: EmptyStateProps) => {
  const { t } = useTranslation("tours");

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-base-300 bg-base-100 p-12 text-center shadow-sm">
      <div className="flex flex-col items-center gap-y-4">
        <h3 className="text-2xl font-bold tracking-tight">{t("emptyState.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("emptyState.description")}</p>
        {onCreateTourClick && <Button onClick={onCreateTourClick}>{t("emptyState.createTour")}</Button>}
      </div>
    </div>
  );
};
