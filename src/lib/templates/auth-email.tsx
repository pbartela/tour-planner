import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./email-layout";

interface AuthEmailProps {
  email: string;
  loginUrl: string;
}

/**
 * Email template for authentication (login/registration)
 * Used when users request a magic link to log in or sign up
 */
export function AuthEmail({ email, loginUrl }: AuthEmailProps) {
  return (
    <EmailLayout preview="Your magic link to sign in to Tour Planner" heading="Welcome to Tour Planner! 👋">
      <Text className="mb-4">
        You requested a magic link to sign in to your account at <strong>{email}</strong>.
      </Text>

      <Text className="mb-6 text-sm text-gray-600">
        Click the button below to securely sign in. If you don't have an account yet, one will be created for you
        automatically.
      </Text>

      {/* CTA Button */}
      <Section className="my-8 text-center">
        <Button
          href={loginUrl}
          className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white no-underline"
        >
          Sign In
        </Button>
      </Section>

      <Text className="text-sm text-gray-600">
        <strong>Note:</strong> This link will expire in 1 hour for security reasons.
      </Text>

      <Text className="text-sm text-gray-600">
        If you didn&apos;t request this email, you can safely ignore it. Your account remains secure.
      </Text>

      <Text className="text-sm text-gray-600">
        If you&apos;re having trouble with the button above, copy and paste this URL into your browser:
      </Text>
      <Text className="text-sm text-gray-600">{loginUrl}</Text>
    </EmailLayout>
  );
}
