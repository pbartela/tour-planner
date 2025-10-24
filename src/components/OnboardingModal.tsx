import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONBOARDING_STEPS = [
  {
    titleKey: "onboarding.step1.title",
    descriptionKey: "onboarding.step1.description",
  },
  {
    titleKey: "onboarding.step2.title",
    descriptionKey: "onboarding.step2.description",
  },
  {
    titleKey: "onboarding.step3.title",
    descriptionKey: "onboarding.step3.description",
  },
];

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const { t } = useTranslation("tours");
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      onClose();
    } catch (error) {
      toast.error(t("onboarding.error"));
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t(step.titleKey)}</DialogTitle>
          <DialogDescription>{t(step.descriptionKey)}</DialogDescription>
        </DialogHeader>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 my-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${index === currentStep ? "bg-primary" : "bg-base-content/30"}`}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleFinish}>
            {t("onboarding.skip")}
          </Button>
          <Button type="button" onClick={handleNext}>
            {currentStep < ONBOARDING_STEPS.length - 1 ? t("onboarding.next") : t("onboarding.finish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
