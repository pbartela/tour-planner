import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { TourFormData } from "./TourFormFields";

interface UseTourFormProps {
  defaultValues?: Partial<TourFormData>;
  onSubmit: (data: {
    title: string;
    destination: string;
    description?: string;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
  onSuccess?: () => void;
}

// Helper function to get date in YYYY-MM-DD format
const getDateString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Helper function to get default dates: today and tomorrow
const getDefaultDates = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today, tomorrow };
};

export const useTourForm = ({ defaultValues, onSubmit, onSuccess }: UseTourFormProps) => {
  const { t } = useTranslation("tours");
  const [error, setError] = useState<string | null>(null);
  const { today, tomorrow } = getDefaultDates();

  const form = useForm<TourFormData>({
    defaultValues: {
      title: defaultValues?.title || "",
      destination: defaultValues?.destination || "",
      description: defaultValues?.description || "",
      start_date: defaultValues?.start_date || today,
      end_date: defaultValues?.end_date || tomorrow,
    },
  });

  const {
    handleSubmit: handleFormSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  const handleSubmit = handleFormSubmit(async (data) => {
    setError(null);

    // Validation
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
      reset();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip");
    }
  });

  const handleClose = (onCloseCallback: () => void) => {
    reset();
    setError(null);
    onCloseCallback();
  };

  return {
    form,
    error,
    isSubmitting,
    handleSubmit,
    handleClose,
  };
};
