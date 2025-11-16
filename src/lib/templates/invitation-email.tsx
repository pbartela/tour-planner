import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./email-layout";

interface InvitationEmailProps {
  inviterName: string;
  tourTitle: string;
  invitationUrl: string;
  expiresAt: Date;
}

/**
 * Email template for tour invitations
 * Used when inviting users (both new and existing) to join a tour
 */
export function InvitationEmail({ inviterName, tourTitle, invitationUrl, expiresAt }: InvitationEmailProps) {
  // Format expiration date
  const expirationDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(expiresAt);

  return (
    <EmailLayout preview={`${inviterName} invited you to join "${tourTitle}"`} heading="You're Invited! 🎉">
      <Text className="mb-4">
        <strong>{inviterName}</strong> has invited you to join the tour:
      </Text>

      <Section className="my-6 rounded-md bg-blue-50 p-6 text-center">
        <Text className="m-0 text-xl font-semibold text-blue-900">{tourTitle}</Text>
      </Section>

      <Text className="mb-4">
        Join the planning and help decide on the best destinations, activities, and schedules for this upcoming
        adventure!
      </Text>

      <Text className="mb-6 text-sm text-gray-600">
        Clicking the button below will log you in (or create your account if you&apos;re new) and take you directly to
        the invitation page.
      </Text>

      {/* CTA Button */}
      <Section className="my-8 text-center">
        <Button
          href={invitationUrl}
          className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white no-underline"
        >
          View Invitation
        </Button>
      </Section>

      <Text className="text-sm text-gray-600">
        <strong>Note:</strong> This invitation expires on {expirationDate}.
      </Text>

      <Text className="text-sm text-gray-600">
        If you&apos;re having trouble with the button above, copy and paste this URL into your browser:
      </Text>
      <Text className="text-sm text-gray-600">{invitationUrl}</Text>
    </EmailLayout>
  );
}
