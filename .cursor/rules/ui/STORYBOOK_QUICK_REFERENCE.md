# Quick Reference: Storybook Stories

## 🎯 Purpose of Stories

Stories serve **two distinct purposes**:

1. **Visual Examples** - Show real-world usage with realistic data
2. **Interactive Documentation** - Let developers explore props via controls

**Don't conflate these!** Create focused examples, not exhaustive permutation matrices.

## ✅ Golden Rule: Story Variants

### **DO NOT create a story for every possible prop combination!**

```tsx
// ❌ BAD - Too many redundant stories
export const RedButton: Story = { args: { color: "red" } };
export const BlueButton: Story = { args: { color: "blue" } };
export const GreenButton: Story = { args: { color: "green" } };
export const YellowButton: Story = { args: { color: "yellow" } };
export const SmallButton: Story = { args: { size: "small" } };
export const MediumButton: Story = { args: { size: "medium" } };
export const LargeButton: Story = { args: { size: "large" } };
// ... 50+ more stories 😱

// ✅ GOOD - Only meaningful variants
export const Default: Story = {
  args: {
    color: "primary",
    size: "medium",
    label: "Click me",
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true, // Drastically changes behavior
  },
};

export const WithIcon: Story = {
  args: {
    ...Default.args,
    icon: <IconExample />, // Changes visual structure
  },
};
```

**Why?** The Controls panel in Storybook's Docs view is designed for exploring variations. Use it!

### When to Create a Story Variant

Create a separate story **ONLY** when:

1. **Drastically Different Visual Appearance**
   - Example: Button with icon vs. without icon
   - Example: Card with image vs. text-only card
   - Example: Expanded accordion vs. collapsed

2. **Fundamentally Different Behavior**
   - Example: Link vs. Button (different HTML elements)
   - Example: Controlled vs. Uncontrolled form input
   - Example: Loading state vs. Success state

3. **Different Use Case/Context**
   - Example: Primary CTA button vs. Destructive action button
   - Example: Inline notification vs. Toast notification
   - Example: Mobile navigation vs. Desktop navigation

### When NOT to Create a Story Variant

**DO NOT** create separate stories for:

- ❌ Different colors (use Controls)
- ❌ Different sizes (use Controls)
- ❌ Different text content (use Controls)
- ❌ Different number values (use Controls)
- ❌ Showing/hiding optional elements (use Controls with boolean)
- ❌ Minor style variations that don't change structure

**Use the Docs tab Controls instead!**

## 📋 Story Structure

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ComponentName } from "./componentName";
import { IconExample } from "components/icons/icons";

const meta = {
  title: "Components/Category/ComponentName",
  component: ComponentName,
  tags: ["autodocs"], // Enables auto-generated docs
  parameters: {
    layout: "centered", // or "fullscreen", "padded"
  },
  argTypes: {
    // Optional: Customize controls
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;
```

## 🎨 Essential Story Types

### 1. Default Story (Always Required)

```tsx
export const Default: Story = {
  args: {
    // Use realistic, production-like default values
    title: "Welcome to Tourcars",
    description: "Europe's leading car manufacturer",
    variant: "primary",
    size: "medium",
  },
};
```

**Purpose:** Show the most common use case with sensible defaults.

### 2. State Variants (Create if behavior changes drastically)

```tsx
// Loading state - shows spinner instead of content
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

// Error state - shows error UI instead of normal content
export const Error: Story = {
  args: {
    ...Default.args,
    error: "Failed to load data",
  },
};

// Disabled state - completely different interaction model
export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
```

### 3. Structural Variants (Create if DOM structure changes)

```tsx
// With icon - additional visual element
export const WithIcon: Story = {
  args: {
    ...Default.args,
    icon: <IconExample className="h-6 w-6" />,
  },
};

// Without description - fewer elements rendered
export const TitleOnly: Story = {
  args: {
    title: Default.args.title,
    // No description prop
  },
};
```

### 4. Interactive Examples (Show real-world usage)

When a story needs state or demonstrates how to compose multiple components, use the `render` function.

**Note:** To ensure Storybook can automatically display the source code, place your logic directly inside the `render` function. Do not hide it in a separate wrapper component.

```tsx
export const InteractiveForm: Story = {
  render: function Render(args) { // Name the function to satisfy hook rules
    const [value, setValue] = React.useState("");
    
    return (
      <ComponentName
        {...args}
        value={value}
        onChange={setValue}
        placeholder="Type something..."
      />
    );
  },
};
```

### 5. Edge Cases (Create if visually distinct)

```tsx
// Very long content - tests layout breaking
export const LongContent: Story = {
  args: {
    ...Default.args,
    title: "This is an extremely long title that might wrap to multiple lines and could potentially break the layout if not handled properly",
    description: "Lorem ipsum dolor sit amet...".repeat(10),
  },
};

// Empty state - completely different UI
export const Empty: Story = {
  args: {
    items: [],
    emptyMessage: "No items found",
  },
};
```

## 🚫 Anti-Patterns (Avoid These!)

### ❌ Creating Exhaustive Color Variants

```tsx
// ❌ DON'T DO THIS
export const PrimaryButton: Story = { args: { variant: "primary" } };
export const SecondaryButton: Story = { args: { variant: "secondary" } };
export const TertiaryButton: Story = { args: { variant: "tertiary" } };
export const SuccessButton: Story = { args: { variant: "success" } };
export const WarningButton: Story = { args: { variant: "warning" } };
export const DangerButton: Story = { args: { variant: "danger" } };
export const InfoButton: Story = { args: { variant: "info" } };
export const LightButton: Story = { args: { variant: "light" } };
export const DarkButton: Story = { args: { variant: "dark" } };

// ✅ DO THIS INSTEAD
export const Default: Story = {
  args: {
    variant: "primary", // Let users explore other variants via Controls
    label: "Click me",
  },
};

// Optional: Only if one variant is drastically different
export const Destructive: Story = {
  args: {
    variant: "danger",
    label: "Delete Account",
    icon: <WarningIcon />,
  },
};
```

### ❌ Creating Size Matrix

```tsx
// ❌ DON'T DO THIS
export const ExtraSmall: Story = { args: { size: "xs" } };
export const Small: Story = { args: { size: "sm" } };
export const Medium: Story = { args: { size: "md" } };
export const Large: Story = { args: { size: "lg" } };
export const ExtraLarge: Story = { args: { size: "xl" } };

// ✅ DO THIS INSTEAD
export const Default: Story = {
  args: {
    size: "md", // Let users explore other sizes via Controls
  },
};
```

### ❌ Creating Text Content Variations

```tsx
// ❌ DON'T DO THIS
export const ShortText: Story = { args: { text: "Hi" } };
export const MediumText: Story = { args: { text: "Hello World" } };
export const LongText: Story = { args: { text: "Hello World, this is longer" } };

// ✅ DO THIS INSTEAD
export const Default: Story = {
  args: {
    text: "Hello World", // Realistic default
  },
};

// Only if it breaks layout (edge case)
export const VeryLongText: Story = {
  args: {
    text: "This is an extremely long text that demonstrates how the component handles text wrapping and overflow scenarios".repeat(3),
  },
};
```

### ❌ Creating Boolean Flag Matrix

```tsx
// ❌ DON'T DO THIS
export const ShowIcon: Story = { args: { showIcon: true } };
export const HideIcon: Story = { args: { showIcon: false } };
export const ShowDescription: Story = { args: { showDescription: true } };
export const HideDescription: Story = { args: { showDescription: false } };
export const ShowIconAndDescription: Story = { 
  args: { showIcon: true, showDescription: true } 
};
// ... 2^n combinations 💀

// ✅ DO THIS INSTEAD
export const Default: Story = {
  args: {
    showIcon: true,
    showDescription: true,
    // Users can toggle these via Controls
  },
};
```

### ❌ Manually Pasting Code into `docs.source`

Avoid using `parameters.docs.source.code` to display story code. It's brittle and becomes outdated. Instead, write your story's `render` function so that Storybook can automatically generate the source code.

```tsx
// ❌ DON'T DO THIS - Manual code is hard to maintain
export const MyStory: Story = {
  render: () => <MyComponentWithState />,
  parameters: {
    docs: {
      source: {
        code: `
// Manually copied and pasted code
const MyComponentWithState = () => {
  const [value, setValue] = React.useState("");
  return <MyComponent value={value} onChange={setValue} />;
}
        `,
      },
    },
  },
};

// ✅ DO THIS INSTEAD - Storybook generates the source automatically
export const MyStory: Story = {
  render: function Render(args) { // Name the function to satisfy hook rules
    const [value, setValue] = React.useState("");
    return <MyComponent {...args} value={value} onChange={setValue} />;
  },
};
```

## 📐 Story Organization

### File Structure

```
components/
  myComponent/
    myComponent.tsx          # Component implementation
    myComponent.test.tsx     # Unit tests
    myComponent.stories.tsx  # Storybook stories
    README.md                # Documentation
```

### Story Naming Convention

```tsx
// ✅ Good names (descriptive and clear)
export const Default: Story = { ... };
export const WithIcon: Story = { ... };
export const Loading: Story = { ... };
export const Error: Story = { ... };
export const Disabled: Story = { ... };
export const LongContent: Story = { ... };
export const Empty: Story = { ... };
export const Interactive: Story = { ... };

// ❌ Bad names (vague or redundant)
export const Example1: Story = { ... };
export const Test: Story = { ... };
export const Story1: Story = { ... };
export const ButtonRed: Story = { ... }; // Use Controls!
export const Size16: Story = { ... };    // Use Controls!
```

## 🎭 Advanced Patterns

### Composing Stories

```tsx
export const Default: Story = {
  args: {
    title: "Article Title",
    author: "John Doe",
    date: "2025-10-17",
  },
};

// Reuse and extend
export const Featured: Story = {
  args: {
    ...Default.args,
    isFeatured: true,
    badge: "Premium",
  },
};

export const WithImage: Story = {
  args: {
    ...Default.args,
    image: "/images/example.jpg",
  },
};
```

### Custom Render Functions

```tsx
export const WithContext: Story = {
  render: (args) => (
    <ThemeProvider theme="dark">
      <ComponentName {...args} />
    </ThemeProvider>
  ),
  args: {
    ...Default.args,
  },
};

export const MultipleInstances: Story = {
  render: (args) => (
    <div className="space-y-4">
      <ComponentName {...args} variant="primary" />
      <ComponentName {...args} variant="secondary" />
      <ComponentName {...args} variant="tertiary" />
    </div>
  ),
  args: {
    label: "Click me",
  },
};
```

### Decorators

```tsx
const meta = {
  title: "Components/MyComponent",
  component: MyComponent,
  decorators: [
    (Story) => (
      <div className="p-8 bg-gray-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MyComponent>;
```

## 🔍 Using Controls Effectively

### Control Types

```tsx
argTypes: {
  // Text input
  title: { control: "text" },
  
  // Number input
  count: { control: "number" },
  
  // Boolean toggle
  disabled: { control: "boolean" },
  
  // Select dropdown
  variant: {
    control: "select",
    options: ["primary", "secondary", "tertiary"],
  },
  
  // Radio buttons
  size: {
    control: "radio",
    options: ["sm", "md", "lg"],
  },
  
  // Color picker
  color: { control: "color" },
  
  // Date picker
  date: { control: "date" },
  
  // Object editor
  config: { control: "object" },
  
  // Disable control (for readonly props)
  id: { control: false },
}
```

### Control Organization

```tsx
argTypes: {
  // Group related controls
  title: {
    control: "text",
    description: "The main heading text",
    table: { category: "Content" },
  },
  description: {
    control: "text",
    description: "The subheading text",
    table: { category: "Content" },
  },
  variant: {
    control: "select",
    options: ["primary", "secondary"],
    table: { category: "Appearance" },
  },
  onClick: {
    action: "clicked",
    table: { category: "Events" },
  },
}
```

## ✅ Story Checklist

```
[ ] Default story with realistic data
[ ] Only create variants that drastically change appearance/behavior
[ ] Use Controls for minor variations (colors, sizes, text)
[ ] Include loading/error states if applicable
[ ] Include edge cases (very long content, empty state)
[ ] Use descriptive story names
[ ] Add argTypes documentation for complex props
[ ] Test interactive functionality with render functions
[ ] Group stories logically in the sidebar
[ ] No TypeScript errors
```

## 💡 Decision Tree: "Should I Create a Story?"

```
Does this variation...
├─ Change the component's structure? (e.g., with/without icon)
│  └─ YES → Create a story ✅
│
├─ Show a different state? (e.g., loading, error, success)
│  └─ YES → Create a story ✅
│
├─ Represent a different use case? (e.g., CTA vs. destructive action)
│  └─ YES → Create a story ✅
│
├─ Demonstrate an edge case? (e.g., very long content)
│  └─ YES → Create a story ✅
│
├─ Just change a color/size/number?
│  └─ NO → Use Controls instead ❌
│
└─ Just toggle visibility of an element?
   └─ NO → Use Controls instead ❌
```

## 🚀 Quick Commands

```bash
# Start Storybook
yarn storybook

# Build Storybook
yarn build-storybook

# Run Storybook tests
yarn test-storybook
```

## 📚 Example: Well-Structured Stories

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShareButton } from "./shareButton";
import { LinkedInIcon, XIcon, FacebookIcon } from "components/icons/icons";

const meta = {
  title: "Components/Buttons/ShareButton",
  component: ShareButton,
  tags: ["autodocs"],
  argTypes: {
    platform: {
      control: "select",
      options: ["linkedin", "x", "facebook", "copy"],
      description: "Social media platform",
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Button size",
    },
  },
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Only 3 stories needed!
export const Default: Story = {
  args: {
    platform: "linkedin",
    href: "https://linkedin.com/share?url=...",
    icon: <LinkedInIcon className="h-6 w-6" />,
    ariaLabel: "Share on LinkedIn",
    size: "md",
  },
};

export const AsButton: Story = {
  args: {
    platform: "copy",
    href: undefined, // Renders as button - drastic behavior change
    icon: <XIcon className="h-6 w-6" />,
    ariaLabel: "Copy link",
    onClick: () => alert("Copied!"),
    size: "md",
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true, // Drastic behavior change
  },
};

// Users can explore all 3 sizes and 4 platforms via Controls
// No need for: SmallLinkedIn, MediumLinkedIn, LargeLinkedIn, SmallFacebook, etc.
```

##  Remember

> **Stories are examples, not test suites.**
> 
> If you can change it with a dropdown in the Docs tab, you don't need a separate story for it.

**The golden question:** "Does this variation teach something new about how to use the component, or is it just showing the same thing with different values?"

If it's the latter, use Controls! 🎛️
