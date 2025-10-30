import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker, getDateFormatHint } from "@/components/ui/DatePicker";
import { useTranslation } from "react-i18next";

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    destination: string;
    description?: string;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
}

export const AddTripModal = ({ isOpen, onClose, onSubmit }: AddTripModalProps) => {
  const { t, i18n } = useTranslation("tours");

  // Helper function to get date in YYYY-MM-DD format
  const getDateString = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Set default dates: today and tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(today);
  const [endDate, setEndDate] = useState<Date | undefined>(tomorrow);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !url.trim() || !startDate || !endDate) {
      setError(t("addTrip.requiredFieldsError"));
      return;
    }

    if (endDate <= startDate) {
      setError(t("addTrip.dateValidationError"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        destination: url.trim(),
        description: description.trim() || undefined,
        start_date: getDateString(startDate),
        end_date: getDateString(endDate),
      });
      //TODO: investigate if this can be done with one function Reset form
      setTitle("");
      setUrl("");
      setDescription("");
      setStartDate(new Date());
      const newTomorrow = new Date();
      newTomorrow.setDate(newTomorrow.getDate() + 1);
      setEndDate(newTomorrow);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setStartDate(new Date());
    const newTomorrow = new Date();
    newTomorrow.setDate(newTomorrow.getDate() + 1);
    setEndDate(newTomorrow);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-base-100 max-w-full sm:max-w-[600px] sm:rounded-lg rounded-none p-0 h-[100vh] sm:h-auto sm:max-h-[90vh] flex flex-col m-0 sm:m-4 sm:translate-x-[-50%] sm:translate-y-[-50%] sm:top-[50%] sm:left-[50%] top-0 left-0 fixed sm:relative">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-base-content/10">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-base-content hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-base-content">{t("addTrip.title")}</h1>
          <div className="w-6" />
        </div>

        <form id="add-trip-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="trip-url" className="text-sm font-medium text-base-content/60">
              {t("addTrip.tripUrl")}
            </Label>
            <Input
              id="trip-url"
              type="url"
              placeholder={t("addTrip.tripUrlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-base-200 border-none rounded-lg p-4 placeholder:text-base-content/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-title" className="text-sm font-medium text-base-content/60">
              {t("addTrip.customTitle")}
            </Label>
            <Input
              id="custom-title"
              type="text"
              placeholder={t("addTrip.customTitlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-base-200 border-none rounded-lg p-4 placeholder:text-base-content/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-base-content/60">
              {t("addTrip.description")}
            </Label>
            <textarea
              id="description"
              placeholder={t("addTrip.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="w-full bg-base-200 border-none rounded-lg p-4 text-base-content placeholder:text-base-content/40 focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium text-base-content/60">
                {t("addTrip.startDate")}
              </Label>
              <DatePicker
                id="start-date"
                value={startDate}
                onChange={setStartDate}
                disabled={isSubmitting}
                placeholder={t("addTrip.startDate")}
                locale={i18n.language}
                minDate={new Date()}
                className="w-full"
                aria-describedby="start-date-hint"
              />
              <p id="start-date-hint" className="text-xs text-base-content/40">
                {t("addTrip.dateFormatLabel")}: {getDateFormatHint(i18n.language)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium text-base-content/60">
                {t("addTrip.endDate")}
              </Label>
              <DatePicker
                id="end-date"
                value={endDate}
                onChange={setEndDate}
                disabled={isSubmitting}
                placeholder={t("addTrip.endDate")}
                locale={i18n.language}
                minDate={startDate || new Date()}
                className="w-full"
                aria-describedby="end-date-hint"
              />
              <p id="end-date-hint" className="text-xs text-base-content/40">
                {t("addTrip.dateFormatLabel")}: {getDateFormatHint(i18n.language)}
              </p>
            </div>
          </div>
        </form>

        {/* Footer with Save button */}
        <div className="p-4 border-t border-base-content/10">
          <Button
            type="submit"
            form="add-trip-form"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-content font-bold py-4 px-6 rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
          >
            {isSubmitting ? t("addTrip.saving") : t("addTrip.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
