# Implementation Roadmap - Tour Planner

**⚠️ IMPORTANT: This file must be updated after each feature implementation!**

Last Updated: 2025-11-05

---

## 📋 Table of Contents

- [Completed Features](#completed-features)
- [Next Steps (Priority Order)](#next-steps-priority-order)
- [Backlog](#backlog)
- [Technical Implementation Notes](#technical-implementation-notes)
- [PRD Status Matrix](#prd-status-matrix)

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

#### 7. Dark Mode - ✅ Complete

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

## 🎯 Next Steps (Priority Order)

### Phase 2: Archive Management (1-2 days)

#### 1. Auto-archiving System (US-023)

**Estimated Time**: 3-4 hours

**Implementation Options**:

1. **Supabase Edge Function** (Recommended):
   - Cron job runs daily at midnight
   - Updates tours where `end_date < CURRENT_DATE` and `status = 'active'`
   - Set `status = 'archived'`

2. **PostgreSQL Trigger**:
   - Computed column based on end_date
   - Automatically updates status

3. **Client-side Check**:
   - Check on tour list fetch
   - Archive tours client-side if needed

**Backend**:

- Edge Function: `supabase/functions/archive-tours/index.ts`
- Schedule: Daily cron job
- Service: `tourService.archiveTour(tourId)`

**Frontend**:

- Filter tabs: "Active" / "Archived"
- Read-only mode for archived tours
- Grey/muted styling for archived cards

**Files to Create/Modify**:

- `supabase/functions/archive-tours/index.ts` (NEW)
- `src/lib/services/tour.service.ts`
- `src/components/tours/TourList.tsx`
- `src/components/tours/TourCard.tsx`

#### 4. Tags System for Archived Tours (US-024, US-025)

**Estimated Time**: 5-6 hours

**Backend**:

- New table: `tour_tags`
  ```sql
  CREATE TABLE tour_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tour_id, tag_name)
  );
  ```
- Only available for archived tours
- Endpoints:
  - `POST /api/tours/{tourId}/tags` - Add tag
  - `DELETE /api/tours/{tourId}/tags/{tagName}` - Remove tag
  - `GET /api/tours/search?tag={tagName}` - Search by tag

**Frontend**:

- Tag input component (pills/chips)
- Search/filter by tags on archive page
- Auto-complete for existing tags

**Files to Create/Modify**:

- `supabase/migrations/*_tour_tags.sql` (NEW)
- `src/pages/api/tours/[tourId]/tags.ts` (NEW)
- `src/lib/services/tour-tag.service.ts` (NEW)
- `src/components/tours/TourTagInput.tsx` (NEW)
- `src/components/tours/TourCard.tsx`

### Phase 3: Account Management (2 days)

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

| ID     | Title                           | Status             | Notes                                      |
| ------ | ------------------------------- | ------------------ | ------------------------------------------ |
| US-009 | Creating a new tour             | ✅ Complete        | AddTripModal (refactored)                  |
| US-010 | Displaying the tour list        | ✅ Complete        | **NEW** Activity Indicator (2025-11-05)    |
| US-011 | Displaying tour details         | ✅ Complete        | TourDetailsView component                  |
| US-012 | Editing a tour by the owner     | ✅ Complete        | **NEW** EditTourModal (2025-01-05)         |
| US-013 | Deleting a tour by the owner    | ✅ Complete        | With confirmation dialog                   |
| US-014 | Leaving a tour by a participant | ❌ Not Implemented | Backend exists, missing UI                 |

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

| ID     | Title                            | Status             | Notes             |
| ------ | -------------------------------- | ------------------ | ----------------- |
| US-023 | Automatic tour archiving         | ❌ Not Implemented | **Next: Phase 2** |
| US-024 | Adding tags to an archived tour  | ❌ Not Implemented | **Next: Phase 2** |
| US-025 | Searching archived tours by tags | ❌ Not Implemented | **Next: Phase 2** |

### Edge Cases

| ID     | Title                      | Status             | Notes             |
| ------ | -------------------------- | ------------------ | ----------------- |
| US-026 | Transfer of tour ownership | ❌ Not Implemented | **Next: Phase 3** |

---

## 🚀 Quick Start for Next Session

### To Continue with Auto-archiving System (US-023):

1. **Choose implementation approach**:
   - **Option A (Recommended)**: Supabase Edge Function with cron job
   - **Option B**: PostgreSQL trigger based on end_date
   - **Option C**: Client-side check on tour list fetch

2. **If using Edge Function** (Option A):

   ```bash
   npx supabase functions new archive-tours
   ```

   Edge function code:

   ```typescript
   import { createClient } from "@supabase/supabase-js";

   Deno.serve(async () => {
     const supabase = createClient(/* ... */);

     const { data, error } = await supabase
       .from("tours")
       .update({ status: "archived" })
       .eq("status", "active")
       .lt("end_date", new Date().toISOString());

     return new Response(JSON.stringify({ archived: data?.length }));
   });
   ```

3. **Configure cron job**:
   - Schedule daily execution at midnight
   - Add to `supabase/functions/archive-tours/cron.yml`

4. **Update frontend**:
   - Add filter tabs: "Active" / "Archived" in TourList
   - Grey/muted styling for archived tour cards
   - Make archived tours read-only

5. **Test**:
   - Create tour with end_date in the past
   - Manually trigger edge function or wait for cron
   - Verify tour status changes to "archived"
   - Verify archived tour appears in "Archived" tab

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
