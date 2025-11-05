import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker, getDateFormatHint } from "@/components/ui/DatePicker";
import { useTranslation } from "react-i18next";

export interface TourFormData {
  title: string;
  destination: string;
  description: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
}

interface TourFormFieldsProps {
  register: UseFormRegister<TourFormData>;
  setValue: UseFormSetValue<TourFormData>;
  watch: UseFormWatch<TourFormData>;
  isSubmitting: boolean;
}

export const TourFormFields = ({ register, setValue, watch, isSubmitting }: TourFormFieldsProps) => {
  const { t, i18n } = useTranslation("tours");

  // Watch date values for validation and DatePicker
  const startDate = watch("start_date");
  const endDate = watch("end_date");

  return (
    <div className="space-y-5 sm:space-y-6">
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
    </div>
  );
};
