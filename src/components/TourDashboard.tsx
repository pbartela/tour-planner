import { QueryProvider } from "@/components/QueryProvider";
import { TourList } from "@/components/tours/TourList";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useState } from "react";

interface TourDashboardProps {
  onboardingCompleted: boolean;
}

export const TourDashboard = ({ onboardingCompleted }: TourDashboardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(!onboardingCompleted);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Optionally, you could refetch user data here to confirm onboarding status,
    // but for now, we'll just close the modal visually.
  };

	return (
		<QueryProvider>
			<TourList />
      <OnboardingModal isOpen={isModalOpen} onClose={handleCloseModal} />
		</QueryProvider>
	);
};

export default TourDashboard;
