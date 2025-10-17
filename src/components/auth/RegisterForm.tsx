"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const RegisterForm = () => {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");

		// TODO: call API endpoint /api/auth/signup
		if (email === "test@test.com") {
			setMessage("Check your email to continue registration.");
		} else {
			setError("Something went wrong. Please try again.");
		}
	};

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Register</CardTitle>
				<CardDescription>Enter your email below to create an account.</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4">
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					{message && <p className="text-sm text-green-600 dark:text-green-500">{message}</p>}
					{error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
					<Button type="submit" className="w-full">
						Continue
					</Button>
				</form>
			</CardContent>
		</Card>
	);
};

export default RegisterForm;
