import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Input } from "./input";

import { FormField } from "./FormField";

const meta: Meta<typeof FormField> = {
  title: "UI/FormField",
  component: FormField,
  tags: ["autodocs"],
  argTypes: {
    required: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

// Basic form field with input
export const Basic: Story = {
  render: () => (
    <FormField label="Email" htmlFor="email">
      <Input id="email" type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

// Required field
export const Required: Story = {
  render: () => (
    <FormField label="Username" htmlFor="username" required>
      <Input id="username" type="text" placeholder="Enter username" />
    </FormField>
  ),
};

// With hint text
export const WithHint: Story = {
  render: () => (
    <FormField label="Password" htmlFor="password" hint="Must be at least 8 characters">
      <Input id="password" type="password" placeholder="Enter password" />
    </FormField>
  ),
};

// With error message
export const WithError: Story = {
  render: () => (
    <FormField label="Email" htmlFor="email-error" error="Please enter a valid email address">
      <Input id="email-error" type="email" placeholder="Enter your email" className="border-error" />
    </FormField>
  ),
};

// Textarea field
export const WithTextarea: Story = {
  render: () => (
    <FormField label="Description" htmlFor="description" hint="Tell us about yourself">
      <textarea
        id="description"
        rows={4}
        placeholder="Enter description"
        className="w-full bg-base-200 border-none rounded-lg p-3 text-base-content placeholder:text-base-content/40 focus:ring-2 focus:ring-primary resize-none"
      />
    </FormField>
  ),
};

// Multiple fields in a form
export const CompleteForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      message: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      if (!formData.name) newErrors.name = "Name is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.message) newErrors.message = "Message is required";

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        console.log("Form submitted:", formData);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <FormField label="Name" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" required hint="We'll never share your email" error={errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </FormField>

        <FormField label="Message" htmlFor="message" required error={errors.message}>
          <textarea
            id="message"
            rows={4}
            placeholder="Enter your message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-base-200 border-none rounded-lg p-3 text-base-content placeholder:text-base-content/40 focus:ring-2 focus:ring-primary resize-none"
          />
        </FormField>

        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
    );
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <FormField label="Username" htmlFor="username-disabled" hint="This field is disabled">
      <Input id="username-disabled" type="text" placeholder="Username" disabled />
    </FormField>
  ),
};
