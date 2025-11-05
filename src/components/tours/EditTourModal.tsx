import { useTranslation } from "react-i18next";
import { TourFormDialog } from "./form/TourFormDialog";
import { TourFormFields } from "./form/TourFormFields";
import { useTourForm } from "./form/useTourForm";
import { useUpdateTourMutation } from "@/lib/hooks/useTourMutations";
import type { TourDetailsDto } from "@/types";
import toast from "react-hot-toast";

interface EditTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: TourDetailsDto;
}

export const EditTourModal = ({ isOpen, onClose, tour }: EditTourModalProps) => {
  const { t } = useTranslation("tours");
  const updateTourMutation = useUpdateTourMutation();

  // Convert ISO date strings to Date objects for the form
  const defaultValues = {
    title: tour.title,
    destination: tour.destination,
    description: tour.description || "",
    start_date: new Date(tour.start_date),
    end_date: new Date(tour.end_date),
  };

  const handleUpdateSubmit = async (data: {
    title: string;
    destination: string;
    description?: string;
    start_date: string;
    end_date: string;
  }) => {
    try {
      await updateTourMutation.mutateAsync({
        tourId: tour.id,
        data: {
          title: data.title,
          destination: data.destination,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
        },
      });
      toast.success(t("editTrip.success"));
    } catch (error) {
      toast.error(t("editTrip.error"));
      throw error;
    }
  };

  const { form, error, isSubmitting, handleSubmit, handleClose } = useTourForm({
    defaultValues,
    onSubmit: handleUpdateSubmit,
    onSuccess: onClose,
  });

  const { register, setValue, watch } = form;

  return (
    <TourFormDialog
      isOpen={isOpen}
      onClose={() => handleClose(onClose)}
      title={t("editTrip.title")}
      isSubmitting={isSubmitting}
      submitButtonText={isSubmitting ? t("editTrip.saving") : t("editTrip.save")}
      formId="edit-trip-form"
      error={error}
    >
      <form id="edit-trip-form" onSubmit={handleSubmit}>
        <TourFormFields register={register} setValue={setValue} watch={watch} isSubmitting={isSubmitting} />
      </form>
    </TourFormDialog>
  );
};
