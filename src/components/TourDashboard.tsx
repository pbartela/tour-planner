import React, { useState } from "react";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AddTripModal } from "@/components/tours/AddTripModal";
import { useTranslation } from "react-i18next";
import { TourList } from "@/components/tours/TourList";
import { QueryProvider } from "@/components/QueryProvider";
import { useUpdateProfileMutation } from "@/lib/hooks/useProfileMutations";
import { useCreateTourMutation } from "@/lib/hooks/useTourMutations";

interface TourDashboardProps {
  onboardingCompleted: boolean;
}

const TourDashboardContent = ({ onboardingCompleted }: TourDashboardProps): React.JSX.Element => {
  useTranslation("tours");
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(onboardingCompleted);
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);

  const { mutate: updateProfile } = useUpdateProfileMutation();
  const { mutate: createTour } = useCreateTourMutation();

  const handleCompleteOnboarding = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateProfile(
        { onboarding_completed: true },
        {
          onSuccess: () => {
            setIsOnboardingDismissed(true);
            resolve();
          },
          onError: (error) => {
            // eslint-disable-next-line no-console
            console.error("Error completing onboarding:", error);
            reject(error);
          },
        }
      );
    });
  };

  const handleSkipOnboarding = () => {
    setIsOnboardingDismissed(true);
  };

  const handleClose = () => {
    setIsOnboardingDismissed(true);
  };

  const handleCreateTour = async (data: {
    title: string;
    destination: string;
    description?: string;
    start_date: string;
    end_date: string;
  }): Promise<void> => {
    return new Promise((resolve, reject) => {
      createTour(data, {
        onSuccess: () => {
          setIsAddTripModalOpen(false);
          // No need to reload - React Query will automatically refetch the tours list
          resolve();
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  };

  return (
    <>
      <OnboardingModal
        isOpen={!isOnboardingDismissed}
        onClose={handleClose}
        onCompleteOnboarding={handleCompleteOnboarding}
        onSkipOnboardign={handleSkipOnboarding}
      />
      <AddTripModal
        isOpen={isAddTripModalOpen}
        onClose={() => setIsAddTripModalOpen(false)}
        onSubmit={handleCreateTour}
      />
      <div className="container mx-auto py-10">
        <TourList onAddTripClick={() => setIsAddTripModalOpen(true)} />
      </div>
    </>
  );
};

const TourDashboard = (props: TourDashboardProps): React.JSX.Element => {
  return (
    <QueryProvider>
      <TourDashboardContent {...props} />
    </QueryProvider>
  );
};

export default TourDashboard;
