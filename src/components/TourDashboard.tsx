import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingModal } from "@/components/OnboardingModal";

interface TourDashboardProps {
  onboardingCompleted: boolean;
}

const TourDashboard = ({ onboardingCompleted }: TourDashboardProps) => {
  if (!onboardingCompleted) {
    return <OnboardingModal isOpen={true} />;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your Dashboard!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="mb-4">You don't have any active tours yet.</p>
            <Button>Create Your First Tour</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TourDashboard;
