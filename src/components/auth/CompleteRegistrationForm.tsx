"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const CompleteRegistrationForm = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // TODO: call API endpoint /api/profiles/me
    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    // On success, redirect to the `/welcome` onboarding page.
    window.location.href = "/welcome";
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Complete Registration</CardTitle>
        <CardDescription>Choose a username to finish setting up your account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="tour_master_42"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
          <Button type="submit" className="w-full">
            Complete Registration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompleteRegistrationForm;
