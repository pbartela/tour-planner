"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const createMagicLinkSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("magicLink.validation.emailInvalid")),
  });

type MagicLinkFormData = z.infer<ReturnType<typeof createMagicLinkSchema>>;

export const LoginForm = ({ redirectTo }: { redirectTo?: string | null }) => {
  const { t, i18n } = useTranslation("auth");
  const magicLinkSchema = createMagicLinkSchema(t);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onSubmit = async (data: MagicLinkFormData) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, redirectTo, locale: i18n.language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("magicLink.error"));
      }

      setMessage(t("magicLink.success"));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t("magicLink.title")}</CardTitle>
        <CardDescription>{t("magicLink.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t("magicLink.emailLabel")}</Label>
            <Input id="email" type="email" placeholder={t("magicLink.emailPlaceholder")} {...register("email")} />
            {errors.email && <p className="text-sm text-red-600 dark:text-red-500">{errors.email.message}</p>}
          </div>
          {message && <p className="text-sm text-green-600 dark:text-green-500">{message}</p>}
          {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t("magicLink.submitting") : t("magicLink.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
