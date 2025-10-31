import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";
import { Button } from "./button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "elevated", "outlined"],
      description: "Card style variant",
    },
    className: { control: "text", description: "Additional classes for Card root" },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-96">
      <CardHeader>
        <CardTitle>Trip to Alps</CardTitle>
        <CardDescription>Jan 12 – Jan 18 • 4 people</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Skiing, snowboarding and hot springs. Forecast looks great.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">Details</Button>
        <Button variant="primary">Open</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithImage: Story = {
  render: (args) => (
    <Card {...args} variant="elevated" className="w-96">
      <figure>
        <img src="https://picsum.photos/640/360" alt="Cover" className="w-full h-44 object-cover rounded-t-xl" />
      </figure>
      <CardHeader>
        <CardTitle>City Break: Lisbon</CardTitle>
        <CardDescription>Weekend getaway • Food & culture</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Explore Alfama, Belém pastries, and ocean views.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="secondary-outline">Save</Button>
        <Button variant="primary">Book</Button>
      </CardFooter>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card variant="default" className="w-96 p-4">
        <h3 className="font-semibold mb-2">Default Variant</h3>
        <p className="text-sm text-base-content/70">Standard card with subtle shadow.</p>
      </Card>
      <Card variant="elevated" className="w-96 p-4">
        <h3 className="font-semibold mb-2">Elevated Variant</h3>
        <p className="text-sm text-base-content/70">Card with enhanced shadow and rounded corners.</p>
      </Card>
      <Card variant="outlined" className="w-96 p-4">
        <h3 className="font-semibold mb-2">Outlined Variant</h3>
        <p className="text-sm text-base-content/70">Card with prominent border and no shadow.</p>
      </Card>
    </div>
  ),
};

export const Compact: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Packing List</CardTitle>
        <CardDescription className="text-xs">Essentials for 3 days</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="list-disc pl-5 text-sm">
          <li>Passport</li>
          <li>Charger</li>
          <li>Jacket</li>
        </ul>
      </CardContent>
      <CardFooter className="p-4 pt-0 justify-end">
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compact spacing using smaller paddings via className overrides.",
      },
    },
  },
};

export const EmptyState: Story = {
  render: (args) => (
    <Card {...args} className="w-96">
      <CardHeader>
        <CardTitle>No Trips Yet</CardTitle>
        <CardDescription>Create your first trip to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-base-content/70">You can add destinations, dates, and participants.</div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="primary">Add Trip</Button>
      </CardFooter>
    </Card>
  ),
};
