# Component Implementation Rules 
## Key Architectural Decisions

### 1. Presentational Component Pattern

**Rule**: Components should be purely presentational with parent-controlled logic.

**Rationale**: 
- Maximum flexibility - any platform can be button or link based on parent needs
- Easier testing - no side effects in components
- Clear separation of concerns
- Better reusability across different contexts

**Implementation**:
```tsx
// Component is presentational
export const SocialShareButton = ({ href, icon, ariaLabel, onClick }) => {
  if (!href) return <button onClick={onClick}>{icon}</button>;
  return <Link href={href} onClick={onClick}>{icon}</Link>;
};

// Parent controls logic
const ShareModal = ({ url, title }) => {
  const getShareUrl = (platform) => {
    // Parent generates URLs
    switch (platform) {
      case "linkedin": return `https://linkedin.com/...${encodeURIComponent(url)}`;
      case "copy": return undefined; // Button action
    }
  };
  
  return <SocialShareButton href={getShareUrl("linkedin")} />;
};
```

### 2. Icon System Consistency

**Rule**: Always use icons from `components/icons/icons.jsx` - never inline SVGs.

**Process**:
1. Save SVG to `components/icons/assets/icon-name.svg`
2. Ensure SVG uses `currentColor` for theme compatibility
3. Export from `icons.jsx` using `generateIconComponent` pattern
4. Import and use in components

**Example**:
```tsx
// icons.jsx
export const FacebookLogo = generateIconComponent({
  src: "/icons/assets/facebook-logo.svg",
  alt: "Facebook Logo",
});

// component.tsx
import { FacebookLogo } from "components/icons/icons";
<FacebookLogo className="h-6 w-6" />
```

### 3. No Direct Browser APIs in Components

**Rule**: Components should never directly call browser APIs like `navigator.clipboard`, `window.open`, or `document` methods.

**Rationale**:
- React-friendly approach
- Easier to test (no mocking required)
- Server-side rendering compatibility
- Parent can control implementation details

**Instead**:
```tsx
// ❌ BAD - Component accesses browser API
const Component = () => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };
};

// ✅ GOOD - Parent handles browser API
const Parent = () => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };
  return <Component onCopy={handleCopy} />;
};
```

### 4. Next.js Link for All Navigation

**Rule**: Use Next.js `Link` component instead of `<a>` tags.

**For external URLs** (social sharing):
```tsx
<Link 
  href="https://external-site.com" 
  target="_blank" 
  rel="noopener noreferrer"
>
  Share
</Link>
```

**For internal navigation**:
```tsx
<Link href="/articles/example">Read Article</Link>
```

### 5. Conditional Rendering Pattern (Button vs Link)

**Rule**: Use `href` prop to determine whether to render button or link.

**Pattern**:
- `href` is `undefined` → Render `<button>`
- `href` is `string` → Render `<Link>`

**Benefits**:
- Single component handles both cases
- Type-safe with TypeScript
- Clear contract for parent components
- Flexible for different use cases

```tsx
interface Props {
  href?: string; // undefined = button, string = link
  icon: ReactNode;
  onClick?: () => void;
}

export const Component: FC<Props> = ({ href, icon, onClick }) => {
  if (!href) {
    return <button onClick={onClick}>{icon}</button>;
  }
  return <Link href={href} onClick={onClick}>{icon}</Link>;
};
```

### 6. Parent Provides Encoded URLs

**Rule**: Parent component is responsible for generating and encoding share URLs.

**Why**: Different contexts may need different URL formats or tracking parameters.

**Example**:
```tsx
// Parent generates all URLs
const ShareModal = ({ url, title }) => {
  const getShareUrl = (platform: SocialPlatform): string | undefined => {
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
        return undefined; // No direct share URLs
    }
  };
  
  return (
    <SocialShareButton
      platform="linkedin"
      href={getShareUrl("linkedin")}
    />
  );
};
```

### 7. Platform-Specific Handling

**Rule**: Understand and document platform limitations.

**Platforms with direct share URLs** (render as Links):
- **LinkedIn**: `https://www.linkedin.com/sharing/share-offsite/?url={url}`
- **X (Twitter)**: `https://twitter.com/intent/tweet?text={title}%20{url}`
- **Facebook**: `https://www.facebook.com/sharer/sharer.php?u={url}`

**Platforms without direct share URLs** (render as Buttons):
- **Copy**: No URL - parent handles `navigator.clipboard.writeText()`
- **Instagram**: No web share URL - parent handles custom logic (e.g., copy + show instructions)

### 8. Comprehensive Testing

**Rule**: Write tests for all component behaviors and states.

**Required test coverage**:
1. Renders as button when `href` is undefined
2. Renders as Link when `href` is provided
3. Calls `onClick` callback correctly
4. Applies custom className properly
5. Tests flexibility (any platform can be button or link based on `href`)

**Example**:
```tsx
describe("SocialShareButton", () => {
  it("renders as button when href is undefined", () => {
    render(<SocialShareButton href={undefined} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
  
  it("renders as Link when href is provided", () => {
    render(<SocialShareButton href="https://example.com" />);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });
  
  it("allows any platform to be rendered as button if no href", () => {
    // Proves flexibility - even linkedin can be a button
    render(<SocialShareButton platform="linkedin" href={undefined} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

### 9. Storybook Documentation

**Rule**: Create comprehensive Storybook stories with multiple examples.

**Required stories**:
1. Individual platform examples (Copy, LinkedIn, X, Facebook, Instagram)
2. Combined layouts (AllPlatforms, ProfessionalNetworks)
3. Custom styling examples
4. Edge cases (empty states, loading, errors)

**Story pattern**:
```tsx
export const LinkedInLink: Story = {
  args: {
    platform: "linkedin",
    href: "https://www.linkedin.com/sharing/share-offsite/?url=...",
    icon: <LinkedInLogo className="h-6 w-6" />,
    ariaLabel: "Share on LinkedIn",
  },
  parameters: {
    docs: {
      description: {
        story: "LinkedIn button renders as Link when href is provided.",
      },
    },
  },
};
```

### 10. Component README Documentation

**Rule**: Every component directory should have a comprehensive README.

**Required sections**:
1. **Purpose**: What the component does
2. **Architecture**: Presentational vs container pattern explanation
3. **Props Table**: All props with types and descriptions
4. **Usage Examples**: Code snippets showing common use cases
5. **Platform Notes**: Platform-specific behavior
6. **Parent Responsibilities**: What the parent must handle
7. **Integration Examples**: How to use with Modal, forms, etc.
8. **Testing**: How to run tests
9. **Accessibility**: ARIA labels and keyboard navigation
10. **Design Reference**: Link to Figma designs

## Implementation Checklist

Use this checklist when implementing components from Figma:

- [ ] Fetch Figma design using MCP server
- [ ] Create component following presentational pattern
- [ ] Use icons from `components/icons/icons.jsx` (add new ones if needed)
- [ ] Use Next.js Link for navigation (no `<a>` tags)
- [ ] No browser API calls in component (delegate to parent)
- [ ] Parent controls all business logic and URL generation
- [ ] TypeScript interfaces defined for all props
- [ ] Comprehensive tests written (all behaviors covered)
- [ ] Storybook stories created (default + variants + edge cases)
- [ ] README documentation complete
- [ ] Accessibility requirements met (ARIA labels, keyboard nav)
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Component renders correctly in Storybook

## Evolution of the Architecture

### Initial Implementation
- Components had inline SVGs
- Components directly called browser APIs
- Used native `<a>` tags
- SocialShareButton had internal URL generation logic

### Final Implementation (After Refactoring)
- Icons from centralized icon system (`components/icons/icons.jsx`)
- All browser API calls delegated to parent
- Uses Next.js Link components
- SocialShareButton is purely presentational with `href`-based rendering
- ShareModal (parent) generates all URLs via `getShareUrl()` function

### Key Insight
> "All elements should be handled by a parent. All should be handled by a shareUrlFunction that is sent from parent and share modal is that parent."

This led to the architectural shift where `href` became the control mechanism:
- `href: undefined` → Component renders button
- `href: string` → Component renders Link
- Parent provides the `href` value, controlling the component's behavior

## Benefits of This Architecture

1. **Flexibility**: Any platform can be button or link based on parent's needs
2. **Testability**: No side effects, easy to test in isolation
3. **Separation of Concerns**: Presentation vs business logic clearly separated
4. **Reusability**: Component can be used in different contexts with different URL strategies
5. **Type Safety**: TypeScript ensures correct prop usage
6. **Maintainability**: Changes to URL formats only affect parent, not child
7. **SSR Compatibility**: No browser API calls means works with server-side rendering

## Common Patterns Established

### 1. Modal Component Pattern
```tsx
<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
  <ModalContent
    onClose={() => setIsOpen(false)}
    onAction={handleAction}
  />
</Modal>
```

### 2. Share URL Generation Pattern
```tsx
const getShareUrl = (platform: string): string | undefined => {
  const encodedUrl = encodeURIComponent(url);
  
  switch (platform) {
    case "linkedin": return `https://linkedin.com/...${encodedUrl}`;
    case "x": return `https://twitter.com/...${encodedUrl}`;
    case "copy": return undefined;
  }
};
```

### 3. Conditional Element Rendering Pattern
```tsx
if (!href) {
  return <button type="button" {...commonProps}>{children}</button>;
}
return <Link href={href} {...commonProps}>{children}</Link>;
```

### 4. Icon Import Pattern
```tsx
import { 
  CopyIcon, 
  LinkedInLogo, 
  XLogo, 
  FacebookLogo, 
  InstagramLogo 
} from "components/icons/icons";
```

### 5. Test Organization Pattern
```tsx
describe("Component", () => {
  describe("Button rendering (no href)", () => {
    // Button tests
  });
  
  describe("Link rendering (with href)", () => {
    // Link tests
  });
  
  describe("Flexibility", () => {
    // Tests proving any platform can be button or link
  });
});
```

## References

- **Figma Designs**: Article Page v1.1
  - GiftArticleModal: Node 502:5800
  - GiftArticleLinkModal: Node 533:1797
  - ShareModal: Node 502:5831

- **Component Locations**:
  - `components/giftArticleModal/`
  - `stories/GiftArticleModal.stories.tsx`
  - `stories/GiftArticleLinkModal.stories.tsx`
  - `stories/ShareModal.stories.tsx`
  - `stories/SocialShareButton.stories.tsx`

- **Icon System**: `components/icons/icons.jsx`
- **Modal Wrapper**: `components/modalNew/modal`
- **Button Component**: `components/simpleButton/simpleButton.tsx`

## Conclusion

These rules represent a comprehensive approach to building maintainable, testable, and flexible React components. The key insight is that **presentational components with parent-controlled logic** provide the best balance between reusability and flexibility while maintaining clean separation of concerns.

When implementing components from Figma designs, always ask:
1. Is this presentational or does it contain business logic?
2. Should the parent control this behavior?
3. Can I make this more flexible for future use cases?
4. Am I following React best practices (no direct DOM/window access)?
5. Have I documented the contract between parent and child?

Following these rules ensures consistent, high-quality component implementations that integrate seamlessly with the existing codebase.
