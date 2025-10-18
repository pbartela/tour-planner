"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const CompleteRegistrationForm = () => {
  const { t } = useTranslation("auth");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // TODO: call API endpoint /api/profiles/me
    if (username.length < 3) {
      setError(t("completeRegistration.error"));
      return;
    }
    // On success, redirect to the `/welcome` onboarding page.
    window.location.href = "/welcome";
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t("completeRegistration.title")}</CardTitle>
        <CardDescription>{t("completeRegistration.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">{t("completeRegistration.usernameLabel")}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t("completeRegistration.usernamePlaceholder")}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
          <Button type="submit" className="w-full">
            {t("completeRegistration.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompleteRegistrationForm;
