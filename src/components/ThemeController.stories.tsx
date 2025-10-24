import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeController } from "./ThemeController";

const meta: Meta<typeof ThemeController> = {
  title: "UI/ThemeController",
  component: ThemeController,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "A theme controller component using DaisyUI dropdown with all available themes.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeController>;

export const Default: Story = {
  render: () => (
    <div className="p-4 bg-base-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-base-content">Theme Controller Demo</h1>
        <ThemeController />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample content to show theme changes */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Sample Card</h2>
            <p className="text-base-content/70">
              This card shows how the theme affects different elements.
            </p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Primary Button</button>
              <button className="btn btn-secondary">Secondary Button</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Another Card</h2>
            <p className="text-base-content/70">
              Different background colors and content styling.
            </p>
            <div className="card-actions justify-end">
              <button className="btn btn-accent">Accent Button</button>
              <button className="btn btn-ghost">Ghost Button</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-300 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Third Card</h2>
            <p className="text-base-content/70">
              More variations to demonstrate theme consistency.
            </p>
            <div className="card-actions justify-end">
              <button className="btn btn-success">Success</button>
              <button className="btn btn-warning">Warning</button>
              <button className="btn btn-error">Error</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 className="text-lg font-semibold text-base-content mb-4">Form Elements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-control">
              <div className="label">
                <span className="label-text text-base-content">Email</span>
              </div>
              <input
                type="email"
                placeholder="your@email.com"
                className="input input-bordered input-primary"
              />
            </label>
          </div>

          <div>
            <label className="form-control">
              <div className="label">
                <span className="label-text text-base-content">Password</span>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered input-secondary"
              />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <button className="btn btn-primary mr-2">Submit</button>
          <button className="btn btn-outline btn-secondary">Cancel</button>
        </div>
      </div>

      <div className="mt-8 alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span className="text-base-content">
          Try different themes using the theme controller dropdown above!
          Available themes include: Default, Light, Dark, Cupcake, Synthwave, Retro, and many more.
        </span>
      </div>
    </div>
  ),
};
