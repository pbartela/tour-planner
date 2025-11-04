import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker, getDateFormatHint } from "@/components/ui/DatePicker";
import { useTranslation } from "react-i18next";
import { DialogTitle } from "@radix-ui/react-dialog";

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

interface FormData {
  title: string;
  destination: string;
  description: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
}

export const AddTripModal = ({ isOpen, onClose, onSubmit }: AddTripModalProps) => {
  const { t, i18n } = useTranslation("tours");
  const [error, setError] = useState<string | null>(null);

  // Helper function to get date in YYYY-MM-DD format
  const getDateString = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Set default dates: today and tomorrow
  const getDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { today, tomorrow };
  };

  const { today, tomorrow } = getDefaultDates();

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      destination: "",
      description: "",
      start_date: today,
      end_date: tomorrow,
    },
  });

  // Watch date values for validation and DatePicker
  const startDate = watch("start_date");
  const endDate = watch("end_date");

  const onFormSubmit = handleFormSubmit(async (data) => {
    setError(null);

    if (!data.title.trim() || !data.destination.trim() || !data.start_date || !data.end_date) {
      setError(t("addTrip.requiredFieldsError"));
      return;
    }

    if (data.end_date <= data.start_date) {
      setError(t("addTrip.dateValidationError"));
      return;
    }

    try {
      await onSubmit({
        title: data.title.trim(),
        destination: data.destination.trim(),
        description: data.description.trim() || undefined,
        start_date: getDateString(data.start_date),
        end_date: getDateString(data.end_date),
      });
      // Reset form using React Hook Form's built-in reset function
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip");
    }
  });

  const handleClose = () => {
    // Reset form using React Hook Form's built-in reset function
    reset();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogTitle>{t("addTrip.title")}</DialogTitle>
      <DialogContent className="bg-base-100 max-w-full sm:max-w-container-sm md:max-w-container-md lg:max-w-xl sm:rounded-lg rounded-none p-0 h-screen sm:h-auto sm:max-h-screen-90 flex flex-col m-0 sm:m-4 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:top-1/2 sm:left-1/2 top-0 left-0 fixed sm:relative">
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

        <form
          id="add-trip-form"
          onSubmit={onFormSubmit}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-5 sm:px-6 sm:py-6 sm:space-y-6"
        >
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
              {...register("destination")}
              disabled={isSubmitting}
              className="w-full bg-base-200 border-none rounded-lg p-3 sm:p-4 placeholder:text-base-content/40"
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
              {...register("title")}
              disabled={isSubmitting}
              className="w-full bg-base-200 border-none rounded-lg p-3 sm:p-4 placeholder:text-base-content/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-base-content/60">
              {t("addTrip.description")}
            </Label>
            <textarea
              id="description"
              placeholder={t("addTrip.descriptionPlaceholder")}
              {...register("description")}
              disabled={isSubmitting}
              rows={4}
              className="w-full bg-base-200 border-none rounded-lg p-3 sm:p-4 text-base-content placeholder:text-base-content/40 focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
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
                onChange={(date) => setValue("start_date", date)}
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
                onChange={(date) => setValue("end_date", date)}
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
        <div className="p-4 sm:p-4 border-t border-base-content/10">
          <Button
            type="submit"
            form="add-trip-form"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-content font-bold py-3 sm:py-4 px-6 rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
          >
            {isSubmitting ? t("addTrip.saving") : t("addTrip.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
