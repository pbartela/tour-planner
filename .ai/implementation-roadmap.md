# Implementation Roadmap - Tour Planner

**⚠️ IMPORTANT: This file must be updated after each feature implementation!**

Last Updated: 2025-11-18

---

## 📋 Table of Contents

- [Completed Features](#completed-features)
- [Next Steps (Priority Order)](#next-steps-priority-order)
- [Backlog](#backlog)
- [Technical Implementation Notes](#technical-implementation-notes)
- [PRD Status Matrix](#prd-status-matrix)
- [Feature Gap Alignment (2025-11-18)](#feature-gap-alignment-2025-11-18)

---

## ✅ Completed Features

### MVP Features (95% → 100% Complete)

#### 1. Tour Management (COMPLETE ✅)

**Status**: All CRUD operations fully implemented

- **Create Tour** - ✅ Complete
  - Backend: `POST /api/tours` (src/pages/api/tours.ts:116-228)
  - Service: `tourService.createTour()` (src/lib/services/tour.service.ts)
  - Frontend: `AddTripModal.tsx` (refactored to use reusable components)
  - Validation: `createTourCommandSchema` (src/lib/validators/tour.validators.ts)

- **Edit Tour** - ✅ **NEWLY IMPLEMENTED (2025-01-05)**
  - Backend: `PATCH /api/tours/{tourId}` (src/pages/api/tours/[tourId].ts:48-104)
  - Service: `tourService.updateTour()` (src/lib/services/tour.service.ts)
  - Frontend: `EditTourModal.tsx` (NEW - composition of reusable components)
  - Reusable Components Created:
    - `TourFormFields.tsx` - Form fields (destination, title, description, dates)
    - `TourFormDialog.tsx` - Dialog wrapper with header/footer
    - `useTourForm.ts` - Custom hook for form logic and validation
  - Integration: `TourDetailsView.tsx` (lines 10, 25, 79-81, 193-195)
  - Translations: Added `editTrip` namespace in en-US and pl-PL
  - Mutation Hook: `useUpdateTourMutation()` with optimistic updates

- **Delete Tour** - ✅ Complete
  - Backend: `DELETE /api/tours/{tourId}` (src/pages/api/tours/[tourId].ts:106-146)
  - Frontend: Confirmation dialog in `TourDetailsView.tsx` (lines 149-190)
  - Requires typing tour title for confirmation

- **List Tours** - ✅ Complete
  - Backend: `GET /api/tours` with pagination (src/pages/api/tours.ts:25-114)
  - Frontend: `TourList.tsx` with grid layout and filtering
  - Features: Pagination, status filtering (active/archived), metadata extraction

#### 2. User Account System - ✅ Complete

- Magic link authentication (passwordless)
- Session management via middleware
- Profile management (view/edit)
- Security: CSRF protection, rate limiting, RLS

#### 3. Comments System - ✅ Complete

- Full CRUD with inline editing
- Pagination support
- Real-time updates via React Query

#### 4. Voting System (Likes) - ✅ Complete

- Toggle like/unlike
- Vote count display
- Supports hidden votes flag

#### 5. Lock/Unlock Voting (US-019) - ✅ **NEWLY IMPLEMENTED (2025-11-05)**

**Why**: Essential for finalizing trip participants and preventing vote changes after decision

**Backend**:

- Migration: `supabase/migrations/20251105110342_add_voting_lock_to_tours.sql`
  - Added `voting_locked` BOOLEAN column to tours table (default: false)
- API Endpoints:
  - `POST /api/tours/{tourId}/voting/lock` (src/pages/api/tours/[tourId]/voting/lock.ts)
  - `POST /api/tours/{tourId}/voting/unlock` (src/pages/api/tours/[tourId]/voting/unlock.ts)
- Service methods: `tourService.lockVoting()` and `unlockVoting()` (src/lib/services/tour.service.ts:312-368)
- Only owner can lock/unlock (enforced by RLS)

**Frontend**:

- Toggle switch in `TourDetailsView.tsx` (lines 4-6, 24-25, 32-52, 165-192)
  - Owner-only visibility
  - Optimistic updates via React Query
  - Toast notifications for success/error
- Updated `VotingSection.tsx` to respect lock status
  - Disables voting button when locked
  - Shows "Voting is locked" message to participants
  - Validation prevents voting when locked
- React Query hooks:
  - `useLockVotingMutation()` (src/lib/hooks/useTourMutations.ts:292-326)
  - `useUnlockVotingMutation()` (src/lib/hooks/useTourMutations.ts:344-378)
- Translations added in both locales:
  - `public/locales/en-US/tours.json` (lockVoting, unlockVoting, votingLocked, etc.)
  - `public/locales/pl-PL/tours.json`

**Files Created**:

- `supabase/migrations/20251105110342_add_voting_lock_to_tours.sql` (NEW)
- `src/pages/api/tours/[tourId]/voting/lock.ts` (NEW - 84 lines)
- `src/pages/api/tours/[tourId]/voting/unlock.ts` (NEW - 84 lines)

**Files Modified**:

- `src/lib/services/tour.service.ts` (added lines 312-368)
- `src/lib/hooks/useTourMutations.ts` (added lines 260-378)
- `src/components/tours/TourDetailsView.tsx` (lines 4-6, 24-25, 32-52, 165-192)
- `src/components/tours/VotingSection.tsx` (added votingLocked prop and logic)
- `src/db/database.types.ts` (regenerated - voting_locked field added)
- `public/locales/en-US/tours.json` (voting lock translations)
- `public/locales/pl-PL/tours.json` (voting lock translations)

#### 6. Activity Indicator (US-010) - ✅ **NEWLY IMPLEMENTED (2025-11-05)**

**Why**: Improves engagement by showing users where new activity happened

**Backend**:

- Migration: `supabase/migrations/20251105120107_add_tour_activity_tracking.sql`
  - Created `tour_activity` table with fields: id, tour_id, user_id, last_viewed_at, created_at
  - Added unique constraint on (tour_id, user_id)
  - Added RLS policies for SELECT, INSERT, UPDATE (users can only access their own records)
  - Added indexes on tour_id and user_id for performance
- API Endpoint:
  - `POST /api/tours/{tourId}/mark-viewed` (src/pages/api/tours/[tourId]/mark-viewed.ts)
  - Updates last_viewed_at timestamp when user opens tour details
- Service: `tourActivityService.markTourAsViewed()` (src/lib/services/tour-activity.service.ts)
  - Upserts tour_activity record with current timestamp
- Updated `tour.service.ts` listToursForUser() method (lines 128-214):
  - Batch fetches tour_activity, latest comments, and latest votes for all tours
  - Compares timestamps to determine has_new_activity flag
  - If user never viewed tour OR (tour updated/new comment/new vote after last view) → has_new_activity = true

**Frontend**:

- `TourCard.tsx` already had activity indicator UI (lines 65-84)
  - Displays primary-colored dot badge when hasNewActivity is true
  - Accessible with aria-label and title attributes
- `TourList.tsx` maps `has_new_activity` from DTO to ViewModel (line 39)
- `TourDetailsView.tsx` auto-marks tour as viewed (lines 1, 7, 27, 35-39)
  - useEffect calls markAsViewedMutation when component mounts
  - Invalidates tours list query to refresh badges
- React Query hook:
  - `useMarkTourAsViewedMutation()` (src/lib/hooks/useTourActivity.ts)
- Translations already existed in both locales:
  - en-US: "New Activity"
  - pl-PL: "Nowa aktywność"

**Files Created**:

- `supabase/migrations/20251105120107_add_tour_activity_tracking.sql` (NEW - 43 lines)
- `src/lib/services/tour-activity.service.ts` (NEW - 47 lines)
- `src/pages/api/tours/[tourId]/mark-viewed.ts` (NEW - 90 lines)
- `src/lib/hooks/useTourActivity.ts` (NEW - 42 lines)

**Files Modified**:

- `src/lib/services/tour.service.ts` (lines 107-114, 128-214)
  - Added updated_at to query
  - Implemented batch activity tracking logic
- `src/components/tours/TourDetailsView.tsx` (lines 1, 7, 27, 35-39)
  - Added useEffect to mark tour as viewed
- `src/types.ts` (line 76)
  - Added updated_at to TourSummaryDto
- `src/db/database.types.ts` (regenerated with tour_activity table)

#### 7. Automatic Tour Archiving (US-023) - ✅ **NEWLY IMPLEMENTED (2025-11-18)**

**Why**: Automatically archive tours after end_date passes, maintaining historical record while keeping active tours list clean

**Backend**:

- Migration: `supabase/migrations/20251118000000_automatic_tour_archiving.sql` (122 lines)
  - Created `cron_job_logs` table for monitoring archiving operations
  - Created `archive_finished_tours()` function with error handling
  - Scheduled daily pg_cron job at 03:00 UTC
  - Returns count of archived tours and logs success/failure
- Read-only enforcement:
  - Created shared utility `tour-status.util.ts` with `ensureTourNotArchived()` function
  - Updated `tour.service.ts` to validate archive status before updates/deletes
  - Updated `comment.service.ts` to prevent commenting on archived tours
  - Updated `vote.service.ts` to prevent voting on archived tours
  - Updated `invitation.service.ts` to prevent inviting to archived tours
  - All throw "Cannot modify an archived tour" error when archive status detected
- Updated `listToursForUser()` to support `status` parameter ("active" or "archived")

**Frontend**:

- `TourList.tsx` (lines 48-81, 93-116, 128):
  - Added Active/Archived tabs using DaisyUI tabs-boxed component
  - State management with `activeTab` useState hook
  - Different empty states for active vs archived tours
  - Archived empty state shows archive icon and descriptive text
  - FAB (Floating Action Button) only visible on "active" tab
- `TourCard.tsx` (lines 15, 32, 37, 42-62, 73, 86-88):
  - Added grayscale filter to archived tour images
  - Added "Archived" badge overlay with archive icon
  - Opacity reduction for archived cards (opacity-80)
  - Muted text colors for archived tour titles
  - Hide activity indicator for archived tours
- `TourHeader.tsx`:
  - Added "Archived" badge next to tour title
  - Show info alert explaining read-only status
  - Hide edit/delete buttons when tour is archived
- `TourDetailsView.tsx`:
  - Hide `TourOwnerControls` component for archived tours
  - Disable all modification UI elements
- Translations added:
  - `tourCard.archived` - "Archived"
  - `tourList.tabs.active` - "Active"
  - `tourList.tabs.archived` - "Archived"
  - `tourList.noArchivedTours` - "No archived tours"
  - `tourList.archivedToursInfo` - "Tours are automatically archived after their end date"
  - `tourDetails.archived` - "Archived"
  - `tourDetails.archivedInfo` - "This tour is archived and cannot be modified"

**Files Created**:

- `supabase/migrations/20251118000000_automatic_tour_archiving.sql` (NEW - 122 lines)
- `src/lib/utils/tour-status.util.ts` (NEW - 26 lines)

**Files Modified**:

- `src/lib/services/tour.service.ts` (added archive validation to updateTour, deleteTour, lockVoting, unlockVoting, listToursForUser)
- `src/lib/services/comment.service.ts` (added archive validation to createComment, updateComment, deleteComment)
- `src/lib/services/vote.service.ts` (added archive validation to toggleVote)
- `src/lib/services/invitation.service.ts` (added archive validation to sendInvitations, acceptInvitation, resendInvitation)
- `src/lib/validators/tour.validators.ts` (updated getToursQuerySchema with status parameter)
- `src/lib/hooks/useTourList.ts` (added status parameter support)
- `src/components/tours/TourList.tsx` (lines 48-81, 93-116, 128)
- `src/components/tours/TourCard.tsx` (lines 15, 32, 37, 42-62, 73, 86-88)
- `src/components/tours/TourHeader.tsx` (added archived badge and alert)
- `src/components/tours/TourDetailsView.tsx` (conditional rendering based on archive status)
- `src/types.ts` (added status field to TourCardViewModel)
- `src/db/database.types.ts` (regenerated with cron_job_logs table)
- `public/locales/en-US/tours.json` (archiving translations)
- `public/locales/pl-PL/tours.json` (archiving translations)

#### 8. Invitation Lifecycle Enhancements - ✅ **NEWLY IMPLEMENTED (2025-11-18)**

**Why**: Complete invitation lifecycle with expiration handling and automatic cleanup

**Backend**:

- Migration: `supabase/migrations/20251118000001_invitation_lifecycle_enhancements.sql` (277 lines)
  - Added 'expired' status to `invitation_status` ENUM type
  - Changed default `expires_at` from 7 to 14 days
  - Created `cleanup_expired_invitations()` function
    - Updates expired pending invitations to 'expired' status
    - Returns count of expired invitations
    - Includes error handling and logging
  - Scheduled daily pg_cron job at 04:00 UTC for cleanup
  - Enhanced `accept_invitation()` function:
    - Check if invitation is expired before accepting
    - Return error if expired: "This invitation has expired"
  - Enhanced `decline_invitation()` function:
    - Check if invitation is expired before declining
    - Return error if expired: "This invitation has expired"
- Updated `invitation.service.ts`:
  - `acceptInvitation()` now handles expired status error
  - `declineInvitation()` now handles expired status error

**Frontend**:

- Existing invitation UI already supports displaying 'expired' status
- Toast notifications show appropriate error messages
- Translation keys already existed for all statuses

**Files Created**:

- `supabase/migrations/20251118000001_invitation_lifecycle_enhancements.sql` (NEW - 277 lines)

**Files Modified**:

- `src/lib/services/invitation.service.ts` (error handling for expired invitations)
- `src/db/database.types.ts` (regenerated with expired status)

#### 9. Tagging System for Archived Tours (US-024, US-025) - ✅ **NEWLY IMPLEMENTED (2025-11-18)**

**Why**: Enable categorization and search of archived tours with multi-tag filtering

**Backend**:

- Migration: `supabase/migrations/20251118000002_tagging_system_enhancements.sql`
  - Added RLS policies for tag creation and removal (participant-only access)
  - Created `get_or_create_tag()` database function for tag normalization
  - Added case-insensitive index: `CREATE INDEX idx_tags_name_lower ON tags(LOWER(name))`
  - Prevents duplicate tags with different casing
- Service: `src/lib/services/tag.service.ts` (NEW - 167 lines)
  - `getTagsForTour()` - Fetch all tags for a specific tour
  - `searchTags()` - Autocomplete search with optional query parameter
  - `addTagToTour()` - Add tag to archived tour (enforces archived-only)
  - `removeTagFromTour()` - Remove tag from archived tour
  - `getAllTags()` - List all available tags for autocomplete
  - Uses `isTourArchived()` check to enforce archived-only tagging
- Updated `tour.service.ts` listToursForUser():
  - Added multi-tag filtering with logical AND (all tags must match)
  - Implemented Set-based intersection for efficient filtering
  - Tag names normalized to lowercase for case-insensitive matching
- API Endpoints:
  - `GET /api/tours/[tourId]/tags` - List tags for tour
  - `POST /api/tours/[tourId]/tags` - Add tag to archived tour
  - `DELETE /api/tours/[tourId]/tags/[tagId]` - Remove tag from archived tour
  - `GET /api/tags` - Search/list all tags with optional query parameter
- Validators: `src/lib/validators/tag.validators.ts` (NEW)
  - `addTagCommandSchema` - Validates tag names (1-50 chars, trimmed)
  - `tagIdSchema` - Validates tag ID parameter
  - `tagSearchQuerySchema` - Validates search queries

**Frontend**:

- Hooks: `src/lib/hooks/useTags.ts` (NEW)
  - `useTourTags()` - React Query hook for fetching tour tags
  - `useSearchTags()` - Autocomplete with 5-minute stale time
  - `useAddTag()` - Mutation with optimistic updates and cache invalidation
  - `useRemoveTag()` - Mutation with cache invalidation
- Components:
  - `TagBadge.tsx` (NEW) - Displays tag with optional remove button and loading state
  - `TagInput.tsx` (NEW) - Input with autocomplete dropdown, filters existing tags, 50 char max
  - `TagsSection.tsx` (NEW) - Complete tag management UI with input, badges, and error handling
- Integration:
  - `TourDetailsView.tsx` - Added `TagsSection` component for archived tours (positioned between Participants and Comments)
- Updated `useTourList.ts`:
  - Added `tags` parameter support for filtering
  - Query key includes tags for proper cache invalidation
  - Passes tags as comma-separated query string
- Translations added:
  - `tags.title` - "Tags"
  - `tags.add` - "Add tag"
  - `tags.addError` - "Failed to add tag"
  - `tags.removeError` - "Failed to remove tag"
  - `tags.noTags` - "No tags yet. Add tags to categorize this tour."
  - `tags.placeholder` - "Enter tag name..."
  - `tags.maxLength` - "Tag name is too long (max 50 characters)"

**Files Created**:

- `supabase/migrations/20251118000002_tagging_system_enhancements.sql` (NEW)
- `src/lib/services/tag.service.ts` (NEW - 167 lines)
- `src/lib/validators/tag.validators.ts` (NEW)
- `src/lib/hooks/useTags.ts` (NEW)
- `src/pages/api/tours/[tourId]/tags.ts` (NEW)
- `src/pages/api/tours/[tourId]/tags/[tagId].ts` (NEW)
- `src/pages/api/tags.ts` (NEW)
- `src/components/tours/TagBadge.tsx` (NEW)
- `src/components/tours/TagInput.tsx` (NEW)
- `src/components/tours/TagsSection.tsx` (NEW)

**Files Modified**:

- `src/lib/services/tour.service.ts` (updated listToursForUser with tag filtering)
- `src/lib/validators/tour.validators.ts` (added tags parameter to getToursQuerySchema)
- `src/lib/hooks/useTourList.ts` (added tags parameter support)
- `src/components/tours/TourDetailsView.tsx` (integrated TagsSection)
- `src/db/database.types.ts` (regenerated)
- `public/locales/en-US/tours.json` (tags translations)
- `public/locales/pl-PL/tours.json` (tags translations)

#### 10. Dark Mode - ✅ Complete

- 30+ DaisyUI themes
- Persistent theme storage
- No FOUC (Flash of Unstyled Content)

### Bonus Features (Beyond MVP)

#### Invitation System - ✅ Complete

- Token-based invitations with 7-day expiration
- Email verification
- Pending invitations indicator
- Accept/decline functionality

#### Internationalization - ✅ Complete

- en-US and pl-PL locales
- Namespaced translations (common, auth, tours)
- URL-based locale routing

---

## Feature Gap Alignment (2025-11-18)

| Funkcja | Priorytet | Status | Źródło | Notatki |
| --- | --- | --- | --- | --- |
| Śledzenie aktywności (`has_new_activity`) | Must | ✅ **COMPLETE** | PRD US-010/020 | Implemented 2025-11-05. Tables `tour_activity`, auto-mark on view. |
| Automatyczne archiwizowanie | Must | ✅ **COMPLETE** | `db-plan.md` §5, PRD US-023 | Implemented 2025-11-18. pg_cron 03:00 UTC + read-only validation. |
| Cykl życia zaproszeń (`expired`) | Must | ✅ **COMPLETE** | PRD US-015/017 | Implemented 2025-11-18. 14-day TTL + cleanup cron 04:00 UTC. |
| Tagowanie archiwów + wyszukiwarka | Should | ✅ **COMPLETE** | PRD US-024/025, `ui-plan.md` §6 | Implemented 2025-11-18. Autocomplete + multi-tag AND filtering. |
| Dwustopniowe usuwanie konta | Should | ⏸️ **DEFERRED** | PRD US-008 | Not implemented. Requires `DELETE /api/profiles/me` + email token. |

> **Implementation Status**: 4 out of 5 high-priority feature gaps completed (80%). Account deletion deferred as optional "Should" priority.
>
> Detailed planning documentation in `.ai/feature-gap/plan.md` can now be archived.

---

## 🎯 Next Steps (Priority Order)

### Phase 3: Account Management (Optional - Deferred)

#### 5. Account Deletion (US-008)

**Estimated Time**: 4-5 hours

**Backend**:

- Endpoint: `DELETE /api/profiles/me`
- Two-step confirmation required
- Trigger owner transfer for owned tours (see US-026)
- Anonymize comments (mechanism already exists)
- Delete user profile and auth record

**Frontend**:

- Delete account button in profile/settings
- Confirmation dialog with verification input
- Warning about consequences
- Transfer ownership flow

**Files to Create/Modify**:

- `src/pages/api/profiles/me.ts` (add DELETE handler)
- `src/lib/services/profile.service.ts`
- `src/components/profile/ProfileView.tsx`
- `src/components/profile/DeleteAccountDialog.tsx` (NEW)

#### 6. Owner Transfer on Account Deletion (US-026)

**Estimated Time**: 3-4 hours

**Backend**:

- Function: `transferTourOwnership(tourId, newOwnerId)`
- Logic: Select next participant by `created_at` (joined date)
- If owner is sole participant, delete tour
- Triggered automatically on account deletion

**Frontend**:

- Notification to new owner (optional)
- Toast message showing transfer

**Files to Create/Modify**:

- `src/lib/services/tour.service.ts`
- `supabase/migrations/*_owner_transfer_function.sql` (NEW)

---

## 📦 Backlog (Future Enhancements)

### Low Priority Features

1. **Participant Limit Enforcement** (US-009)
   - Check participant count before accepting invitations
   - Display "Tour Full" when limit reached
   - Estimated: 2-3 hours

2. **Like Threshold Achievement** (US-009)
   - Visual indicator when threshold reached
   - Auto-lock voting option when reached
   - Celebration animation/toast
   - Estimated: 2-3 hours

3. **Tour Images/Photos**
   - Upload tour photos
   - Photo gallery
   - Supabase Storage integration
   - Estimated: 1 day

4. **Email Notifications**
   - New comment notifications
   - Invitation reminders
   - Vote milestone notifications
   - Estimated: 2 days

5. **Mobile App (React Native)**
   - iOS and Android apps
   - Share Supabase backend
   - Estimated: 2-4 weeks

---

## 🔧 Technical Implementation Notes

### Architecture Patterns Used

#### 1. Service Layer Pattern

All business logic extracted to `src/lib/services/`:

- `tour.service.ts` - Tour CRUD operations
- `comment.service.ts` - Comment operations
- `vote.service.ts` - Voting logic
- `invitation.service.ts` - Invitation management
- `profile.service.ts` - Profile management

**Key Principle**: Services receive `SupabaseClient` and `userId`, never import clients directly.

#### 2. API Route Pattern

Standard structure for all API endpoints:

```typescript
export const prerender = false;

export const POST: APIRoute = async ({ locals, request }) => {
  // 1. Validate session
  const user = await validateSession(locals.supabase);

  // 2. Rate limiting
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

  // 3. Validate input with Zod
  const parsed = schema.safeParse(data);

  // 4. Call service layer
  const result = await service.method(supabase, user.id, parsed.data);

  // 5. Return standardized response
  return new Response(JSON.stringify(result), { status: 200 });
};
```

#### 3. Reusable Form Components Pattern (NEW - Added 2025-01-05)

For tour forms (Add/Edit), we use composition of reusable components:

**Components**:

- `TourFormFields.tsx` - All form fields (destination, title, description, dates)
- `TourFormDialog.tsx` - Dialog wrapper (header, body, footer)
- `useTourForm.ts` - Custom hook for form logic (validation, submission, state)

**Benefits**:

- Code reuse between AddTripModal and EditTourModal
- Reduced duplication (from 244 lines to 43 lines per modal)
- Easier maintenance and testing
- Consistent UX across create/edit flows

**Usage Example**:

```typescript
export const AddTripModal = ({ isOpen, onClose, onSubmit }) => {
  const { form, error, isSubmitting, handleSubmit, handleClose } = useTourForm({
    onSubmit,
    onSuccess: onClose,
  });

  return (
    <TourFormDialog {...dialogProps}>
      <form onSubmit={handleSubmit}>
        <TourFormFields {...formProps} />
      </form>
    </TourFormDialog>
  );
};
```

#### 4. React Query Patterns

**Mutations with Optimistic Updates**:

- `useCreateTourMutation()`
- `useUpdateTourMutation()` - Optimistically updates both tour list and details cache
- `useDeleteTourMutation()`
- `useVoteMutation()` - Optimistic vote toggle

**Queries with Caching**:

- `useTourList()` - Paginated, filterable
- `useTourDetails()` - Individual tour data
- `useComments()` - Paginated comments
- `useVotes()` - Vote data

#### 5. Type Safety

All API contracts defined in `src/types.ts`:

- **DTOs** (Data Transfer Objects): Response shapes
  - `TourDetailsDto`, `TourSummaryDto`, `ProfileDto`, etc.
- **Commands**: Request payloads
  - `CreateTourCommand`, `UpdateTourCommand`, etc.
- Derived from `database.types.ts` (generated from Supabase schema)

**Type Generation**:

```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

#### 6. Database & RLS

**Row Level Security** (RLS) is enabled on all tables:

- `tours` - Users can only see tours they participate in
- `comments` - Users can only CRUD comments on tours they participate in
- `votes` - Users can only vote on tours they participate in
- `invitations` - Users can only see their own invitations

**Never bypass RLS in application code!**

#### 7. Security Services

Located in `src/lib/server/`:

- `session-validation.service.ts` - Validates user sessions securely
- `csrf.service.ts` - CSRF token generation and validation
- `rate-limit.service.ts` - In-memory rate limiting
- `logger.service.ts` - Secure error logging (redacts sensitive data)
- `env-validation.service.ts` - Runtime environment validation

#### 8. Internationalization

**Structure**:

- Locales: `en-US`, `pl-PL`
- Namespaces: `common`, `auth`, `tours`
- Files: `public/locales/{locale}/{namespace}.json`

**Workflow**:

1. Add translation keys in code: `t("namespace:key")` or `t("key")`
2. Run: `npm run i18n:extract`
3. Translate keys in both `en-US` and `pl-PL`

**Translation Conventions**:

- Use descriptive keys: `editTrip.title`, `addTrip.saving`
- Group by feature/action: `addTrip.*`, `editTrip.*`, `comments.*`
- Keep consistent across locales

---

## 📊 PRD Status Matrix

Complete status of all User Stories from `prd.md`:

### Authentication and Onboarding

| ID     | Title                                | Status      | Notes                               |
| ------ | ------------------------------------ | ----------- | ----------------------------------- |
| US-001 | New user registration via magic link | ✅ Complete | Magic link auth implemented         |
| US-002 | Logging into the system              | ✅ Complete | Magic link with 15-20min expiration |
| US-003 | New user onboarding                  | ✅ Complete | OnboardingModal component           |

### User Account Management

| ID     | Title                         | Status             | Notes                     |
| ------ | ----------------------------- | ------------------ | ------------------------- |
| US-004 | Viewing user profile          | ✅ Complete        | ProfileView component     |
| US-005 | Editing user profile          | ✅ Complete        | ProfileEditForm component |
| US-006 | Changing application language | ✅ Complete        | en-US, pl-PL supported    |
| US-007 | Changing application theme    | ✅ Complete        | 30+ DaisyUI themes        |
| US-008 | Deleting a user account       | ❌ Not Implemented | **Next: Phase 3**         |

### Tour Management

| ID     | Title                           | Status             | Notes                                   |
| ------ | ------------------------------- | ------------------ | --------------------------------------- |
| US-009 | Creating a new tour             | ✅ Complete        | AddTripModal (refactored)               |
| US-010 | Displaying the tour list        | ✅ Complete        | **NEW** Activity Indicator (2025-11-05) |
| US-011 | Displaying tour details         | ✅ Complete        | TourDetailsView component               |
| US-012 | Editing a tour by the owner     | ✅ Complete        | **NEW** EditTourModal (2025-01-05)      |
| US-013 | Deleting a tour by the owner    | ✅ Complete        | With confirmation dialog                |
| US-014 | Leaving a tour by a participant | ❌ Not Implemented | Backend exists, missing UI              |

### Participants and Invitations

| ID     | Title                             | Status      | Notes                          |
| ------ | --------------------------------- | ----------- | ------------------------------ |
| US-015 | Inviting participants to a tour   | ✅ Complete | InvitationForm component       |
| US-016 | Removing participants from a tour | ✅ Complete | InvitedUsersList component     |
| US-017 | Accepting a tour invitation       | ✅ Complete | InviteAcceptanceView component |

### Voting and Interactions

| ID     | Title                        | Status      | Notes                                          |
| ------ | ---------------------------- | ----------- | ---------------------------------------------- |
| US-018 | Voting for a tour (Like)     | ✅ Complete | VotingSection component                        |
| US-019 | Managing voting by the owner | ✅ Complete | **NEW** Lock/Unlock Voting toggle (2025-11-05) |
| US-020 | Adding a comment to a tour   | ✅ Complete | AddCommentForm component                       |
| US-021 | Editing my own comment       | ✅ Complete | Inline editing in CommentItem                  |
| US-022 | Deleting my own comment      | ✅ Complete | With confirmation dialog                       |

### Archive and Search

| ID     | Title                            | Status      | Notes                                   |
| ------ | -------------------------------- | ----------- | --------------------------------------- |
| US-023 | Automatic tour archiving         | ✅ Complete | **NEW** pg_cron job + UI (2025-11-18)   |
| US-024 | Adding tags to an archived tour  | ✅ Complete | **NEW** Full tagging system (2025-11-18) |
| US-025 | Searching archived tours by tags | ✅ Complete | **NEW** Multi-tag filtering (2025-11-18) |

### Edge Cases

| ID     | Title                      | Status             | Notes             |
| ------ | -------------------------- | ------------------ | ----------------- |
| US-026 | Transfer of tour ownership | ❌ Not Implemented | **Next: Phase 3** |

---

## 🚀 Quick Start for Next Session

### Current Implementation Status (2025-11-18)

**Recently Completed (2025-11-18)**:
- ✅ Automatic tour archiving with pg_cron (US-023)
- ✅ Invitation lifecycle with expiration (US-015/017)
- ✅ Tagging system for archived tours (US-024/025)
- ✅ Read-only enforcement for archived tours

**Available Next Steps**:

1. **Account Deletion (US-008)** - Optional "Should" priority
   - Two-step confirmation with email verification
   - Estimated: 4-5 hours
   - See Phase 3 section above for details

2. **Owner Transfer on Deletion (US-026)** - Depends on US-008
   - Automatic ownership transfer to next participant
   - Estimated: 3-4 hours

3. **Backlog Features** - Lower priority enhancements
   - Participant limit enforcement (US-009)
   - Like threshold achievements (US-009)
   - Tour images/photo gallery
   - Email notifications system
   - Mobile app (React Native)

**Testing Recommendations**:
- Add E2E tests for archiving workflow
- Add E2E tests for tagging system
- Add unit tests for tag.service.ts
- Add unit tests for tour-status.util.ts

---

## 📝 Update Instructions

**When implementing a new feature, update this file with**:

1. Move the feature from "Next Steps" to "Completed Features"
2. Add implementation date
3. List all modified/created files with line numbers
4. Update the PRD Status Matrix
5. Add any new technical patterns or learnings
6. Update the "Quick Start for Next Session" section

**Template for Completed Feature**:

```markdown
#### Feature Name (US-XXX) - ✅ **NEWLY IMPLEMENTED (YYYY-MM-DD)**

**Backend**:

- Endpoints: ...
- Services: ...
- Migrations: ...

**Frontend**:

- Components: ...
- Hooks: ...
- Translations: ...

**Files Created/Modified**:

- `path/to/file.ts` (lines X-Y)
- `path/to/new-file.tsx` (NEW)
```

---

**End of Roadmap**
