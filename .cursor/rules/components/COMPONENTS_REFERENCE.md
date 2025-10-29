# Components Reference

This document lists all existing components in the Tour Planner application, organized by category. Use this reference when working with or creating new components.

## Authentication Components

### AuthHeader
**Location:** `src/components/auth/AuthHeader.tsx`
**Description:** Header component for authentication pages with title, description, and icon.
**Props:**
- `title: string` - Main heading text
- `description: string` - Supporting description text
- `className?: string` - Additional CSS classes
- All standard div HTML attributes

**Usage:**
```tsx
<AuthHeader 
  title="Welcome Back"
  description="Sign in to your account"
/>
```

### LoginForm
**Location:** `src/components/auth/LoginForm.tsx`
**Description:** Form component for user login with email/password or social providers.

### LogoutContent
**Location:** `src/components/auth/LogoutContent.tsx`
**Description:** Component for handling user logout functionality.

### SupabaseAuthListener
**Location:** `src/components/auth/SupabaseAuthListener.tsx`
**Description:** Component that listens to Supabase authentication state changes and updates the UI accordingly.

## Tour Components

### TourDashboard
**Location:** `src/components/TourDashboard.tsx`
**Description:** Main dashboard component that displays tour overview and handles onboarding modal. Manages creation of new tours and displays empty state when no tours exist.
**Props:**
- `onboardingCompleted: boolean` - Whether user has completed onboarding

**Features:**
- Shows OnboardingModal for new users
- Integrates AddTripModal for creating tours
- Displays welcome message and empty state
- Handles tour creation API calls

### TourList
**Location:** `src/components/tours/TourList.tsx`
**Description:** Component that fetches and displays a grid of tour cards. Handles loading states, error states, and empty states.
**Features:**
- Uses `useTourList` hook for data fetching
- Displays SkeletonLoader while loading
- Shows EmptyState when no tours exist
- Formats date ranges based on locale
- Grid layout responsive (1 column mobile, 2 tablet, 3 desktop)

### TourCard
**Location:** `src/components/tours/TourCard.tsx`
**Description:** Card component for displaying individual tour information in the tour list.
**Props:**
- `tour: TourCardViewModel` - Tour data including:
  - `id: string`
  - `url: string`
  - `title: string`
  - `dateRange: string`
  - `hasNewActivity: boolean`

**Features:**
- Clickable card linking to tour detail page
- Displays activity indicator when tour has new activities
- Hover effects with shadow transitions

### AddTripModal
**Location:** `src/components/tours/AddTripModal.tsx`
**Description:** Modal dialog for creating new trips/tours. Includes form fields for title, destination, description, and date range.
**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal closes
- `onSubmit: (data) => Promise<void>` - Callback with tour data when form is submitted

**Form Fields:**
- Title (required)
- Destination/URL (required)
- Description (optional)
- Start Date (required, defaults to today)
- End Date (required, defaults to tomorrow)

**Features:**
- Form validation with error messages
- Loading state during submission
- Internationalization support
- Date input fields

## UI Components (shadcn/ui based)

### Button
**Location:** `src/components/ui/button.tsx`
**Description:** Versatile button component with DaisyUI styling variants. Supports multiple colors, sizes, and styles.
**Props:**
- `variant?: string` - DaisyUI color variants (neutral, primary, secondary, accent, info, success, warning, error) and style variants (outline, ghost, link)
- `size?: "xs" | "sm" | "md" | "lg" | "xl"` - DaisyUI size variants
- `asChild?: boolean` - Render as child component (Radix UI Slot)
- Standard button HTML attributes

**Available Variants:**
- Color: neutral, primary, secondary, accent, info, success, warning, error
- Style: outline, ghost, link (can be combined with colors)
- Size: xs, sm, md, lg, xl

### Card
**Location:** `src/components/ui/card.tsx`
**Description:** Card container component with sub-components for structured content display.
**Exports:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Features:**
- DaisyUI base styling (base-100 background, base-300 border)
- Consistent spacing and shadows
- Responsive design

### Dialog
**Location:** `src/components/ui/dialog.tsx`
**Description:** Modal dialog component built on Radix UI Dialog primitive, styled with DaisyUI.
**Exports:**
- `Dialog` - Root component
- `DialogTrigger` - Button/link that opens dialog
- `DialogContent` - Dialog container with backdrop
- `DialogHeader` - Header section
- `DialogTitle` - Dialog title
- `DialogDescription` - Dialog description
- `DialogFooter` - Footer section

**Features:**
- Accessible modal with focus trap
- Backdrop overlay
- DaisyUI styling
- Keyboard navigation (ESC to close)

### Input
**Location:** `src/components/ui/input.tsx`
**Description:** Text input component with DaisyUI styling and variant support.
**Props:**
- `variant?: string` - DaisyUI color variants
- `size?: "xs" | "sm" | "md" | "lg" | "xl"` - DaisyUI size variants
- Standard input HTML attributes

### InputWithLabel
**Location:** `src/components/ui/InputWithLabel.tsx`
**Description:** Composite input component that includes a label for form fields.

### Label
**Location:** `src/components/ui/label.tsx`
**Description:** Form label component for accessibility and styling.

## Date Components

### DatePicker
**Location:** `src/components/ui/DatePicker.tsx`
**Description:** Single date selection component with popover calendar interface.
**Props:**
- `value?: Date` - Selected date
- `onChange?: (date: Date | undefined) => void` - Date change handler
- `placeholder?: string` - Placeholder text
- `variant?: string` - DaisyUI color variant
- `size?: "xs" | "sm" | "md" | "lg" | "xl"` - DaisyUI size variant
- `disabled?: boolean` - Disabled state
- `required?: boolean` - Required field
- `name?: string` - Form field name
- `id?: string` - Component ID
- Accessibility attributes (aria-label, aria-describedby)

**Features:**
- Popover-based calendar interface
- Full keyboard navigation
- Screen reader support
- Form integration with hidden input
- DaisyUI styling variants

### DateRangePicker
**Location:** `src/components/ui/DateRangePicker.tsx`
**Description:** Date range selection component with dual-month calendar view.
**Props:**
- `value?: DateRange` - Selected date range ({ from: Date, to: Date })
- `onChange?: (range: DateRange | undefined) => void` - Range change handler
- `placeholder?: string` - Placeholder text
- Same variant, size, and accessibility props as DatePicker

**Features:**
- Dual-month calendar display
- Range selection with visual feedback
- Start and end date validation

### DaisyCalendar
**Location:** `src/components/ui/DaisyCalendar.tsx`
**Description:** Standalone calendar component with daisyUI styling for month/year display and date selection.
**Props:**
- `variant?: "default" | "bordered" | "dashed"` - DaisyUI card variant
- `size?: "sm" | "md" | "lg" | "xl"` - DaisyUI card size
- `buttonVariant?: string` - Button variant for navigation
- `showOutsideDays?: boolean` - Show days outside current month
- `captionLayout?: "label" | "dropdown"` - Month/year caption layout
- All react-day-picker DayPicker props

### Calendar
**Location:** `src/components/ui/calendar.tsx`
**Description:** Base calendar component from react-day-picker, styled with DaisyUI.

### Popover
**Location:** `src/components/ui/popover.tsx`
**Description:** Popover component from Radix UI, used by DatePicker components for positioning.

**Note:** See `src/components/ui/README.md` for detailed date component documentation and usage examples.

## Shared/Utility Components

### EmptyState
**Location:** `src/components/shared/EmptyState.tsx`
**Description:** Component displayed when a list or view has no content. Shows message and action button.
**Features:**
- Internationalized text
- Centered layout with dashed border
- Call-to-action button
- DaisyUI base styling

### SkeletonLoader
**Location:** `src/components/shared/SkeletonLoader.tsx`
**Description:** Loading placeholder component with animated skeleton effect.
**Features:**
- Pulse animation
- Card-like structure
- Used during data fetching states

## Theme Components

### ThemeProvider
**Location:** `src/components/ThemeProvider.tsx`
**Description:** Context provider for theme management. Applies DaisyUI themes and handles system theme detection.
**Props:**
- `children: React.ReactNode` - Child components
- `userTheme?: string` - User's preferred theme from server

**Features:**
- Supports all DaisyUI themes
- System theme detection (light/dark based on OS preference)
- Theme persistence in localStorage
- Automatic theme application via data-theme attribute

**Supported Themes:**
light, dark, cupcake, bumblebee, emerald, corporate, synthwave, retro, cyberpunk, valentine, halloween, garden, forest, aqua, lofi, pastel, fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade, night, coffee, winter

### ThemeController
**Location:** `src/components/ThemeController.tsx`
**Description:** UI component for selecting and changing themes. Dropdown menu with all available DaisyUI themes.
**Features:**
- Dropdown interface
- Radio button theme selection
- Theme persistence
- Accessible with ARIA labels

## Provider Components

### QueryProvider
**Location:** `src/components/QueryProvider.tsx`
**Description:** React Query (TanStack Query) provider component for data fetching and caching.
**Props:**
- `children: React.ReactNode` - Child components

**Usage:**
Wraps the application to enable React Query hooks throughout the component tree.

## Modal Components

### OnboardingModal
**Location:** `src/components/OnboardingModal.tsx`
**Description:** Multi-step onboarding modal that guides new users through the application.
**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal is closed
- `onSkipOnboardign: () => void` - Callback when user skips onboarding
- `onCompleteOnboarding: () => Promise<void>` - Callback to complete onboarding

**Features:**
- Multi-step wizard interface
- Step navigation (prev/next)
- Skip functionality
- Completion handler that updates user profile
- Error handling with toast notifications

## Debug/Development Components

### DebugAuthStatus
**Location:** `src/components/DebugAuthStatus.tsx`
**Description:** Development component for displaying current authentication state. Useful for debugging auth issues.

## Component Categories Summary

### By Purpose
- **Authentication:** AuthHeader, LoginForm, LogoutContent, SupabaseAuthListener
- **Tours:** TourDashboard, TourList, TourCard, AddTripModal
- **UI Primitives:** Button, Card, Dialog, Input, Label, InputWithLabel
- **Date Selection:** DatePicker, DateRangePicker, DaisyCalendar, Calendar, Popover
- **Layout/State:** EmptyState, SkeletonLoader, QueryProvider, ThemeProvider, ThemeController
- **User Experience:** OnboardingModal
- **Development:** DebugAuthStatus

### By Type
- **React Components (TSX):** All components in `src/components/**/*.tsx`
- **Astro Components:** Layout components in `src/layouts/*.astro`

## Component Development Guidelines

1. **Styling:** All components should use DaisyUI classes for styling. Avoid custom CSS when possible.
2. **Accessibility:** Include proper ARIA attributes, keyboard navigation, and semantic HTML.
3. **Internationalization:** Use `react-i18next` for translatable strings via `useTranslation` hook.
4. **TypeScript:** All components should be properly typed with TypeScript interfaces for props.
5. **Error Handling:** Handle loading, error, and empty states appropriately.
6. **Responsive Design:** Use Tailwind responsive prefixes (sm:, md:, lg:, xl:) for mobile-first design.

## Storybook Documentation

Several components have Storybook stories for interactive documentation:
- `Button` - `src/components/ui/button.stories.tsx`
- `Input` - `src/components/ui/input.stories.tsx`
- `ThemeController` - `src/components/ThemeController.stories.tsx`
- `DatePicker` - `src/components/ui/DatePicker.stories.tsx`
- `DateRangePicker` - `src/components/ui/DateRangePicker.stories.tsx`
- `DaisyCalendar` - `src/components/ui/DaisyCalendar.stories.tsx`
- `DateComponents` - `src/components/ui/DateComponents.stories.tsx`

Run `npm run storybook` to view interactive component documentation.

