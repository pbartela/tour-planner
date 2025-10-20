import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useCallback, useState } from "react";
import debounce from "lodash/debounce";

//TODO: Translate validation messages
const CompleteRegistrationSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username cannot exceed 20 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
});

type CompleteRegistrationFormValues = z.infer<typeof CompleteRegistrationSchema>;

export const CompleteRegistrationForm = () => {
  const { t } = useTranslation("auth");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    watch,
  } = useForm<CompleteRegistrationFormValues>({
    resolver: zodResolver(CompleteRegistrationSchema),
    mode: "onBlur",
  });

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }
    setIsCheckingUsername(true);
    try {
      const response = await fetch("/api/profiles/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      setIsUsernameAvailable(data.isAvailable);
    } catch {
      setIsUsernameAvailable(null); // Reset on error
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const debouncedCheckUsername = useCallback((username: string) => {
    const debouncedFn = debounce(() => checkUsername(username), 500);
    debouncedFn();
  }, []);

  watch((value) => {
    if (value.username) {
      debouncedCheckUsername(value.username);
    }
  });

  const onSubmit = async (data: CompleteRegistrationFormValues) => {
    // Final check before submitting
    const validationResult = await trigger("username");
    if (!validationResult || errors.username || isUsernameAvailable === false) {
      toast.error(t("completeRegistration.usernameTaken"));
      return;
    }

    try {
      const response = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          display_name: data.username,
          onboarding_completed: true,
        }),
      });

      if (response.ok) {
        await response.json();
        toast.success(t("completeRegistration.success"));
        // Force a page reload to ensure the middleware picks up the updated profile
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || t("completeRegistration.error"));
      }
    } catch {
      toast.error(t("completeRegistration.error"));
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t("completeRegistration.title")}</CardTitle>
        <CardDescription>{t("completeRegistration.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">{t("completeRegistration.usernameLabel")}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t("completeRegistration.usernamePlaceholder")}
              {...register("username")}
            />
            {isCheckingUsername && <p className="text-sm text-gray-500">{t("completeRegistration.checking")}</p>}
            {isUsernameAvailable === true && !isCheckingUsername && (
              <p className="text-sm text-green-600">{t("completeRegistration.usernameAvailable")}</p>
            )}
            {isUsernameAvailable === false && !isCheckingUsername && (
              <p className="text-sm text-red-600">{t("completeRegistration.usernameTaken")}</p>
            )}
            {errors.username && <p className="text-sm text-red-600 dark:text-red-500">{errors.username.message}</p>}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting || isCheckingUsername || isUsernameAvailable === false || isUsernameAvailable === null
            }
          >
            {isSubmitting ? t("completeRegistration.submitting") : t("completeRegistration.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompleteRegistrationForm;
