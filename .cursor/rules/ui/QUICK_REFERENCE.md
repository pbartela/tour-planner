# Quick Reference: Figma Component Implementation

## 🚀 Quick Start

1. Fetch Figma design → 2. Implement component → 3. Add tests → 4. Create stories → 5. Document

## ✅ Golden Rules (Never Break These)

### 1. **Presentational Pattern**

```tsx
// ✅ GOOD - Presentational only, good when this is a page specific logic
const Button = ({ href, onClick }) => {
  if (!href) return <button onClick={onClick}>Click</button>;
  return (
    <Link href={href} onClick={onClick}>
      Click
    </Link>
  );
};

// ❌ BAD - Internal logic
const Button = ({ url, platform }) => {
  const href = generateUrl(platform, url); // Don't do this!
  return <Link href={href}>Click</Link>;
};
```

### 2. **Icon System Only**

```tsx
// ✅ GOOD
import { FacebookLogo } from "components/icons/icons";
<FacebookLogo className="h-6 w-6" />

// ❌ BAD
<svg>...</svg> // Never inline SVGs!
```

### 3. **No Browser APIs**

```tsx
// ✅ GOOD
<Component onCopy={parentHandlesCopy} />;

// ❌ BAD
navigator.clipboard.writeText(text); // Not in component!
```

### 4. **Next.js Link Always**

```tsx
// ✅ GOOD
<Link href="/path" target="_blank" rel="noopener noreferrer">Link</Link>

// ❌ BAD
<a href="/path">Link</a> // Never use <a> tags!
```

### 5. **Parent Controls Logic**

```tsx
// ✅ GOOD - Parent generates URLs
const Parent = () => {
  const url = `https://linkedin.com/...${encodeURIComponent(data)}`;
  return <Child href={url} />;
};

// ❌ BAD - Child generates URLs
const Child = ({ data }) => {
  const url = `https://linkedin.com/...${encodeURIComponent(data)}`;
  return <Link href={url}>Share</Link>;
};
```

### 6. **Declaring internal functions and static objects**

```tsx
 DO: Declare Helper Function OUTSIDE your Component

(Typically above it in the same file)

When: Your helper function...

    Is Pure: Doesn't directly read/write component state, props, or hooks.

    Needs Stability: Its reference should remain constant across renders (e.g., when passed as a prop to a React.memo child).

    Is Reusable: Could be used by multiple components in this file.

    Is Complex: Contains significant logic that would clutter your main component.

    Is Testable in Isolation: Can be easily unit-tested without a React environment.

Example:
code Jsx


// ✅ DO: Good for pure functions, stable references
const formatDateTime = (date) => new Date(date).toLocaleString();

function MyComponent({ timestamp, onClick }) {
  const formatted = formatDateTime(timestamp); // Uses external helper
  return <button onClick={onClick}>{formatted}</button>;
}

❌ DON'T: Declare Helper Function OUTSIDE your Component

(Instead, keep it INSIDE)

When: Your helper function...

    Needs Component State/Props/Hooks: Directly accesses useState, props, useContext, useRef, etc.

    Modifies Component State: Calls setSomething from useState.

    Is Highly Local & Simple: It's a trivial, one-liner, single-use piece of logic tightly coupled to that specific component.

    Captures Dynamic Render Values: Needs to 'close over' variables created within the component's render scope without explicit passing.

Example:
code Jsx


// ❌ DON'T (declare outside if it needs state/props):
// This helper needs `setCount` and `step` from component scope.
// It must be defined inside.
const incrementCount = (currentCount, step, setCount) => {
  setCount(currentCount + step);
};

function Counter({ step = 1 }) {
  const [count, setCount] = useState(0);

  // ✅ DO: Declare this INSIDE (or use `useCallback`)
  const handleIncrement = () => {
    setCount(prevCount => prevCount + step); // Needs `setCount` and `step`
  };

  return (
    <button onClick={handleIncrement}>
      Count: {count}
    </button>
  );
}


// 💡 Use useCallback for stable internal functions
const memoizedCallback = useCallback(() => {
  // ... logic using state/props ...
}, [dependency1, dependency2]); // List all component-scope dependencies here

```

### 7. **Static Objects and Constants**

**CRITICAL:** Never declare static objects inside component render functions. Objects created in the component body are recreated on every render, causing unnecessary re-renders and performance issues.

```tsx
// ✅ DO: Declare static objects OUTSIDE component
const SHARE_LABELS = {
  copy: "Copy link to clipboard",
  linkedin: "Share on LinkedIn",
  x: "Share on X (Twitter)",
  facebook: "Share on Facebook",
  instagram: "Share on Instagram",
};

const MyComponent = () => {
  return <ShareButtons labels={SHARE_LABELS} />;
};

// ❌ DON'T: Declare objects inside component body
const MyComponent = () => {
  // This object is recreated on EVERY render!
  const shareLabels = {
    copy: "Copy link to clipboard",
    linkedin: "Share on LinkedIn",
    x: "Share on X (Twitter)",
    facebook: "Share on Facebook",
    instagram: "Share on Instagram",
  };

  return <ShareButtons labels={shareLabels} />;
};

// ✅ DO: Use useMemo ONLY if the object depends on props/state
const MyComponent = ({ platform }) => {
  const shareLabels = useMemo(
    () => ({
      copy: `Copy ${platform} link`,
      linkedin: `Share ${platform} on LinkedIn`,
      // ... dynamic values based on props
    }),
    [platform]
  );

  return <ShareButtons labels={shareLabels} />;
};
```

**Rule of thumb:**

- Static data (no props/state) → Declare outside component as `const`
- Dynamic data (uses props/state) → Use `useMemo` with proper dependencies
- Never create objects/arrays directly in component body or render

## 📋 Component Checklist

```
[ ] Presentational pattern (no business logic)
[ ] Icons from components/icons/icons.jsx
[ ] Next.js Link (no <a> tags)
[ ] No browser APIs (navigator, window, document)
[ ] Internal functions that does not rely on props should be declared out of component scope
[ ] Static objects/constants declared outside component (not in render)
[ ] Parent provides URLs/data via props
[ ] TypeScript interfaces for all props
[ ] Tests: rendering, interactions, conditional, edge cases
[ ] Stories: default, variants, interactive, edge cases
[ ] README: purpose, props, usage, examples
[ ] Accessibility: ARIA labels, keyboard nav
[ ] No TypeScript errors
[ ] All tests passing
```

## 🎯 Component Pattern

```tsx
import React from "react";
import Link from "next/link";
import classNames from "classnames";

export interface ComponentProps {
  href?: string; // undefined = button, string = link
  icon: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({ href, icon, ariaLabel, onClick, className }) => {
  const baseClasses = classNames("base-styles", className);

  // Button when href is undefined
  if (!href) {
    return (
      <button type="button" onClick={onClick} className={baseClasses} aria-label={ariaLabel}>
        {icon}
      </button>
    );
  }

  // Link when href is provided
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={baseClasses}
      aria-label={ariaLabel}
    >
      {icon}
    </Link>
  );
};
```

## 🧪 Test Pattern

```tsx
describe("Component", () => {
  it("renders as button when href undefined", () => {
    render(<Component href={undefined} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders as link when href provided", () => {
    render(<Component href="https://example.com" />);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("calls onClick callback", () => {
    const onClick = jest.fn();
    render(<Component onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📖 Story Pattern

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Component } from "./component";

const meta = {
  title: "Components/Component",
  component: Component,
  tags: ["autodocs"],
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: "https://example.com",
    icon: <Icon className="h-6 w-6" />,
    ariaLabel: "Example",
  },
};

export const AsButton: Story = {
  args: {
    href: undefined,
    icon: <Icon className="h-6 w-6" />,
    ariaLabel: "Example",
  },
};
```

## 🎨 Icon Addition

```bash
# 1. Save SVG (ensure currentColor for fills/strokes)
components/icons/assets/new-icon.svg

# 2. Export in icons.jsx
export const NewIcon = generateIconComponent({
  src: "/icons/assets/new-icon.svg",
  alt: "New Icon",
});

# 3. Import and use
import { NewIcon } from "components/icons/icons";
<NewIcon className="h-6 w-6" />
```

## 🔗 Share URL Patterns

```tsx
// Parent component
const getShareUrl = (platform: string): string | undefined => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedTitle}%20${encodedUrl}`;

    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    case "copy":
    case "instagram":
      return undefined; // No direct share URLs - handle in onClick
  }
};
```

## 🚫 Anti-Patterns (Avoid These!)

```tsx
// ❌ DON'T: Inline SVGs
<svg>
  <path d="..." />
</svg>;

// ❌ DON'T: Browser APIs in component
navigator.clipboard.writeText(text);
window.open(url);
document.getElementById("x");

// ❌ DON'T: Native anchor tags
<a href="...">Link</a>;

// ❌ DON'T: URL generation in child
const Child = ({ url }) => {
  const shareUrl = generateUrl(url);
  return <Link href={shareUrl}>Share</Link>;
};

// ❌ DON'T: Platform-specific logic in reusable component
if (platform === "linkedin") {
  /* special case */
}

// ❌ DON'T: Hardcoded values
const color = "#1a73e8";
const url = "https://linkedin.com/...";

// ❌ DON'T: Objects created in component body
const MyComponent = () => {
  const config = { foo: "bar" }; // Recreated every render!
  return <Child config={config} />;
};

// ❌ DON'T: Arrays created in component body
const MyComponent = () => {
  const items = ["a", "b", "c"]; // Recreated every render!
  return <List items={items} />;
};
```

## ⚡ Quick Commands

```bash
# Run tests
yarn test componentName.test.tsx --no-coverage

# Run all related tests
yarn test giftArticleModal --no-coverage

# Start Storybook
yarn storybook

# Check TypeScript errors
yarn tsc --noEmit
```

## 📚 Key Files

- **Icons**: `components/icons/icons.jsx`
- **Icon Assets**: `components/icons/assets/`
- **Modal Wrapper**: `components/modalNew/modal`
- **Button Component**: `components/simpleButton/simpleButton.tsx`
- **Instructions**: `.github/instructions/figma-mcp-components.instructions.md`

## 💡 Remember

> **Presentational components with parent-controlled logic** = Maximum flexibility + Easy testing + Clear separation of concerns

The `href` prop is your friend:

- `href={undefined}` → Renders `<button>`
- `href="https://..."` → Renders `<Link>`

This single pattern enables infinite flexibility! 🎉
