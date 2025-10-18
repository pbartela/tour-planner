"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("login.validation.emailInvalid")),
  });

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export const LoginForm = ({ redirectTo }: { redirectTo?: string | null }) => {
  const { t } = useTranslation("auth");
  const loginSchema = createLoginSchema(t);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, redirectTo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("login.error"));
      }

      setMessage(t("login.success"));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
        <CardDescription>{t("login.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t("login.emailLabel")}</Label>
            <Input id="email" type="email" placeholder={t("login.emailPlaceholder")} {...register("email")} />
            {errors.email && <p className="text-sm text-red-600 dark:text-red-500">{errors.email.message}</p>}
          </div>
          {message && <p className="text-sm text-green-600 dark:text-green-500">{message}</p>}
          {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
