import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AddTripModal } from "@/components/tours/AddTripModal";
import { patch, post, handleApiResponse } from "@/lib/client/api-client";

interface TourDashboardProps {
  onboardingCompleted: boolean;
}

const TourDashboard = ({ onboardingCompleted }: TourDashboardProps): React.JSX.Element => {
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(onboardingCompleted);
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);

  const handleCompleteOnboarding = async (): Promise<void> => {
    try {
      const response = await patch("/api/profiles/me", { onboarding_completed: true });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setIsOnboardingDismissed(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error; // Re-throw so OnboardingModal can handle the error
    }
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
    const response = await post("/api/tours", data);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create tour");
    }

    handleApiResponse(response);

    // Reload page to show the new tour
    if (typeof window !== "undefined") {
      window.location.reload();
    }
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
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your Dashboard!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="mb-4">You don&apos;t have any active tours yet.</p>
              <Button onClick={() => setIsAddTripModalOpen(true)}>Create Your First Tour</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default TourDashboard;
