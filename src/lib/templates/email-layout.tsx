import { Body, Container, Head, Heading, Html, Preview, Section, Text, Tailwind } from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

/**
 * Base email layout component
 * Provides consistent styling and structure for all emails
 */
export function EmailLayout({ preview, heading, children }: EmailLayoutProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{preview}</Preview>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-2xl rounded-lg bg-white px-8 py-10 shadow-lg">
            {/* Header with logo */}
            <Section className="mb-8 text-center">
              <Heading className="m-0 text-3xl font-bold text-gray-900">Tour Planner</Heading>
            </Section>

            {/* Main heading */}
            <Heading className="mb-6 text-2xl font-semibold text-gray-800">{heading}</Heading>

            {/* Content */}
            <Section className="text-base leading-relaxed text-gray-700">{children}</Section>

            {/* Footer */}
            <Section className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
              <Text className="m-0">
                This email was sent by Tour Planner. If you didn&apos;t expect this email, you can safely ignore it.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
