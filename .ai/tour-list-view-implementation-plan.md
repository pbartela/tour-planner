# View Implementation Plan: Tour List View (Dashboard)

## 1. Overview
This document outlines the implementation plan for the Tour List View, which serves as the main dashboard for authenticated users. Its primary purpose is to display a list of all active tours the user is participating in. The view will handle loading states, an empty state for users with no tours, and provide clear navigation to create new tours or view existing ones.

## 2. View Routing
- **Path**: `/`
- **Accessibility**: This view should be the default page for authenticated users. Unauthenticated users attempting to access this path should be redirected to the login page (`/auth/signin`).

## 3. Component Structure
The view will be built using a main Astro page that renders a React component as an island for dynamic data fetching and rendering.

```
- /src/pages/index.astro (Astro Page)
  - /src/layouts/Layout.astro (Main Layout)
    - /src/components/tours/TourList.tsx (React Island)
      - /src/components/shared/SkeletonLoader.tsx (Conditional)
      - /src/components/shared/EmptyState.tsx (Conditional)
      - /src/components/tours/TourCard.tsx[] (Conditional)
```

## 4. Component Details

### `TourList.tsx` (React)
- **Component description**: A client-side React component responsible for fetching and displaying the user's active tours. It manages the view's state: loading, empty, error, and success (data available).
- **Main elements**:
    - A `div` that acts as a responsive grid container (`grid`, `gap-4`, etc.).
    - Conditional rendering logic:
        - If loading, it renders a list of `SkeletonLoader` components.
        - If data is fetched but the list is empty, it renders the `EmptyState` component.
        - If data is present, it maps over the array of tours and renders a `TourCard` for each.
        - If an error occurs, it displays an error message.
- **Handled interactions**: This component primarily handles the data fetching lifecycle on mount. It does not handle direct user input.
- **Handled validation**: It checks if the fetched `data.data` array is empty to conditionally render the `EmptyState` component.
- **Types**: `PaginatedToursDto`, `TourSummaryDto`.
- **Props**: None.

### `TourCard.tsx` (React)
- **Component description**: A presentational component that displays a summary of a single tour. Each card is a clickable link that navigates to the tour's detail page.
- **Main elements**:
    - An `<a>` tag wrapping the entire card, with `href` pointing to `/tours/[tour.id]`.
    - `<h2>` for the tour title.
    - `<p>` for the formatted date range.
    - A conditionally rendered `<div>` or `<span>` to act as a visual indicator for new activity, displayed as a small colored dot.
- **Handled interactions**: Navigation to the tour detail view on click.
- **Handled validation**: It checks the `has_new_activity` boolean prop to determine whether to display the new activity indicator.
- **Types**: `TourCardViewModel`.
- **Props**:
    - `tour: TourCardViewModel`

### `SkeletonLoader.tsx` (React)
- **Component description**: A static, presentational component that provides a visual placeholder while tour data is being fetched, improving perceived performance.
- **Main elements**: A container `div` with shimmering, greyed-out shapes that mimic the layout of a `TourCard`. It should use Tailwind CSS animation classes (`animate-pulse`).
- **Props**: None.

### `EmptyState.tsx` (React)
- **Component description**: A static, presentational component shown when the user has no active tours. It guides them toward creating their first tour.
- **Main elements**:
    - A container `div`.
    - A message, e.g., "You have no active tours."
    - A call-to-action button/link styled prominently, e.g., "Create Your First Tour," which navigates to the tour creation page.
- **Props**: None.

## 5. Types
The implementation will require modifications to existing DTOs and the creation of a new ViewModel for the `TourCard` component.

### `TourSummaryDto` (Modification Required)
This DTO, defined in `src/types.ts`, needs a new field to support the "new activity" indicator feature.
**Backend Dependency**: The `GET /api/tours` endpoint must be updated to provide this field.

```typescript
// in src/types.ts
export type TourSummaryDto = Pick<
  Tables<"tours">,
  "id" | "title" | "destination" | "start_date" | "end_date" | "status"
> & {
  has_new_activity: boolean; // This field needs to be added by the backend
};
```

### `TourCardViewModel` (New)
This ViewModel represents the data transformed specifically for the `TourCard.tsx` component's needs. The transformation logic will reside within the `TourList.tsx` component before passing props down.

```typescript
export interface TourCardViewModel {
  id: string;
  url: string; // e.g., "/tours/some-uuid"
  title: string;
  dateRange: string; // e.g., "Jul 10 - Jul 15, 2026"
  hasNewActivity: boolean;
}
```

## 6. State Management
State will be managed primarily by **React Query** for server state, encapsulated within a custom hook.

- **Custom Hook**: `useTourList.ts`
  - **Purpose**: To abstract the logic for fetching active tours, including caching, refetching, and error handling.
  - **Implementation**: It will use `useQuery` from `@tanstack/react-query`.
    - `queryKey`: `['tours', { status: 'active' }]`
    - `queryFn`: An async function that calls `GET /api/tours` and returns the `PaginatedToursDto` payload.
  - **Return Value**: The hook will return the standard `useQuery` result object: `{ data, isLoading, isError, error, refetch }`.

## 7. API Integration
- **Endpoint**: `GET /api/tours`
- **Method**: `GET`
- **Request**: No body or special headers are required, beyond the standard JWT `Authorization` header handled by the Supabase client. No query parameters are needed, as the `status` defaults to `active`.
- **Response Type**: `PaginatedToursDto`. The component will primarily use the `data.data` array from this response.
- **Integration**: The `useTourList` hook will be responsible for making the API call. The `TourList.tsx` component will call this hook to get the data and render the UI accordingly.

## 8. User Interactions
- **Page Load**: The user navigates to `/`. The `TourList` component mounts, displays skeleton loaders, and fetches data. The view then updates to show either the tour list or the empty state message.
- **Click Tour Card**: The user clicks on a `TourCard` component. They are immediately navigated to `/tours/[tourId]` via a standard anchor tag.
- **Click "Create New Tour" Button**: From the `EmptyState` component, the user clicks the create button and is navigated to the tour creation page/modal.

## 9. Conditions and Validation
- **Authentication**: The `index.astro` page should perform a server-side check for an active user session. If no session exists, it must redirect to `/auth/signin`.
- **Empty List**: The `TourList.tsx` component checks if `data.data.length === 0` after a successful API fetch. If true, it renders the `EmptyState` component.
- **New Activity**: The `TourCard.tsx` component checks the `hasNewActivity` boolean prop. If true, it renders a visual indicator element.

## 10. Error Handling
- **API/Network Errors**: If the `useTourList` hook returns `isError: true`, the `TourList.tsx` component will render a user-friendly error state. This state should include a message like "Failed to load tours" and a "Retry" button that calls the `refetch` function provided by the `useQuery` result.
- **Unauthorized Access (401)**: While server-side redirects are preferred, if a `401` is received on the client, a global error handler or a side effect in the `useTourList` hook should redirect the user to the login page.

## 11. Implementation Steps
1.  **Backend Update (Dependency)**: Ensure the backend developer has updated the `GET /api/tours` endpoint to include the `has_new_activity: boolean` field in the response for each tour.
2.  **Update Types**: Modify `TourSummaryDto` in `src/types.ts` to include the new `has_new_activity` field.
3.  **Create Custom Hook**: Implement the `useTourList.ts` hook using `@tanstack/react-query` to fetch data from `GET /api/tours`.
4.  **Develop UI Components**:
    -   Create `src/components/tours/TourCard.tsx`.
    -   Create `src/components/shared/SkeletonLoader.tsx`.
    -   Create `src/components/shared/EmptyState.tsx`.
5.  **Develop `TourList` Component**:
    -   Create `src/components/tours/TourList.tsx`.
    -   Integrate the `useTourList` hook.
    -   Implement the conditional rendering logic for loading, empty, error, and success states.
    -   Inside the success state, map the DTO to the `TourCardViewModel` and pass the transformed data as props to the `TourCard.tsx` component.
6.  **Create Astro Page**:
    -   Create (or update) `src/pages/index.astro`.
    -   Add a server-side script to check for authentication and handle redirects.
    -   Render the `<TourList client:load />` component within the main layout.
7.  **Styling**: Apply Tailwind CSS, DaisyUI, and Shadcn styles to all new components to ensure they are responsive and match the application's design system.
8.  **Testing**: Manually test all scenarios: loading state, empty state, data-filled state, error state, and navigation from cards and buttons.



