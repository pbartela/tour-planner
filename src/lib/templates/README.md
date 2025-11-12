# Email Templates

This directory contains React Email templates used for sending emails via Resend.

## Structure

- `email-layout.tsx` - Base layout component with consistent styling
- `invitation-email.tsx` - Tour invitation email template
- Future templates can be added here (e.g., `notification-email.tsx`, `reminder-email.tsx`)

## Technology

We use [React Email](https://react.email/) to build email templates with React components and Tailwind CSS styling.

### Benefits:
- **Type-safe**: Full TypeScript support
- **Component-based**: Reusable components for consistent design
- **Tailwind CSS**: Familiar utility-first styling
- **Automatic responsive**: Works across all email clients
- **Preview**: Can preview templates in development

## Creating New Templates

1. Create a new `.tsx` file in this directory
2. Import and use `EmailLayout` for consistent structure
3. Use `@react-email/components` for email-safe components
4. Export the template component
5. Add the template to `email.service.ts`

### Example:

```tsx
import { Text, Button } from "@react-email/components";
import { EmailLayout } from "./email-layout";

interface MyEmailProps {
  userName: string;
  actionUrl: string;
}

export function MyEmail({ userName, actionUrl }: MyEmailProps) {
  return (
    <EmailLayout
      preview="Preview text shown in inbox"
      heading="Email Heading"
    >
      <Text>Hello {userName}!</Text>
      <Button
        href={actionUrl}
        className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white no-underline"
      >
        Click Here
      </Button>
    </EmailLayout>
  );
}
```

**Important:** The `<Head />` component is automatically included in `EmailLayout` inside the `<Tailwind>` wrapper. This is required for Tailwind classes (especially pseudo-classes like `hover:`) to work properly in emails.

## Style Guidelines

- Use Tailwind utility classes for styling
- Keep colors consistent with brand (blue-600 for primary, gray-700 for text)
- Always include a preview text (shown in email inbox)
- Always include a plain text fallback for links
- Keep emails concise and focused on single action
- **Avoid pseudo-classes** like `hover:`, `focus:`, `active:` - they don't work reliably in email clients
- Use inline styles for critical styling when Tailwind classes don't work

## Testing

Emails are rendered to HTML and sent via Resend.

In **development**:
- Emails are sent to Mailpit/Inbucket (http://localhost:54324)
- SMTP server on localhost:54325 (configured in `supabase/config.toml`)
- Check console for email preview logs
- Test with: `node test-email.mjs` from project root

In **production**:
- Emails are sent via Resend to real addresses
- Monitor deliverability in Resend Dashboard

## Available Components

From `@react-email/components`:
- `Button` - CTA buttons with proper email client support
- `Text` - Paragraph text with proper spacing
- `Heading` - Heading elements (h1-h6)
- `Section` - Container for grouping content
- `Container` - Main content container
- `Preview` - Preview text shown in inbox
- `Link` - Anchor tags
- `Img` - Images with fallback support
- `Html`, `Head`, `Body` - Document structure

## Resources

- [React Email Documentation](https://react.email/)
- [React Email Components](https://react.email/docs/components/html)
- [Resend Documentation](https://resend.com/docs)
