import { useTranslation } from "react-i18next";
import { TourFormDialog } from "./form/TourFormDialog";
import { TourFormFields } from "./form/TourFormFields";
import { useTourForm } from "./form/useTourForm";

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
  const { t } = useTranslation("tours");

  const { form, error, isSubmitting, handleSubmit, handleClose } = useTourForm({
    onSubmit,
    onSuccess: onClose,
  });

  const { register, setValue, watch } = form;

  return (
    <TourFormDialog
      isOpen={isOpen}
      onClose={() => handleClose(onClose)}
      title={t("addTrip.title")}
      isSubmitting={isSubmitting}
      submitButtonText={isSubmitting ? t("addTrip.saving") : t("addTrip.save")}
      formId="add-trip-form"
      error={error}
    >
      <form id="add-trip-form" onSubmit={handleSubmit}>
        <TourFormFields register={register} setValue={setValue} watch={watch} isSubmitting={isSubmitting} />
      </form>
    </TourFormDialog>
  );
};
