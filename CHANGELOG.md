# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-04

### Added

#### US-008: Account Deletion Feature ✨
- **Two-step confirmation dialog** for account deletion
  - Checkbox acknowledgment: "I understand this action is permanent..."
  - Text confirmation: User must type "DELETE" (English) or "USUŃ" (Polish)
- **Complete data cleanup** on account deletion:
  - Avatar deletion from Supabase Storage (with graceful failure handling)
  - Tour activity records deletion
  - Automatic tour ownership transfer to earliest-joined participant
  - Comment anonymization (preserves history, removes attribution)
  - Cascade deletion of participants, votes, and invitations
- **User experience enhancements**:
  - "Danger Zone" section in Profile page with red-themed warning
  - User logged out and redirected to home page after deletion
  - Toast notifications for success/error feedback
- **Internationalization**: Full support for en-US and pl-PL locales
- **Comprehensive testing**:
  - 13 unit tests for `profileService.deleteAccount()`
  - 8 E2E tests covering UI validation, error handling, and i18n

**Files Added:**
- `src/components/profile/DeleteAccountDialog.tsx`
- `src/lib/hooks/useAccountMutations.ts`
- `tests/e2e/profile/delete-account.spec.ts`
- `.ai/account-deletion-implementation.md` (detailed documentation)

**Files Modified:**
- `src/lib/services/profile.service.ts` (added `deleteAccount()` method)
- `src/pages/api/profiles/me.ts` (added DELETE handler)
- `src/components/profile/ProfileView.tsx` (added Danger Zone section)
- `public/locales/en-US/common.json` (added translations)
- `public/locales/pl-PL/common.json` (added translations)

**Implementation Details:**
- CSRF protection on DELETE endpoint
- Secure error logging (no sensitive data exposure)
- Graceful degradation for storage deletion failures
- Integration with existing `handle_user_deletion()` database trigger

---

### Verified

#### US-014: Leave Tour Feature ✅
- Confirmed full implementation already exists
- UI in `ParticipantsList.tsx` with "Leave Tour" button
- Backend endpoint: `DELETE /api/tours/[tourId]/participants/[userId]`
- Authorization: participants can leave, owners can remove others
- Dialog confirmation with proper error handling

#### US-026: Tour Ownership Transfer ✅
- Confirmed full implementation via database trigger
- Function: `handle_user_deletion()` in initial schema migration
- Automatically transfers ownership to earliest-joined participant
- Deletes tour if no other participants exist
- Tested as part of US-008 account deletion

---

### Changed

- **Project Status**: Updated from "In Development" to "Complete"
- **Feature Coverage**: Now 100% (26/26 User Stories implemented)
- **README.md**: Updated badges to reflect complete status
- **CLAUDE.md**: Added documentation for account deletion feature

---

### Documentation

- Created comprehensive implementation guide: `.ai/account-deletion-implementation.md`
- Updated `.ai/missing-features.md` with implementation details
- Updated `CLAUDE.md` with Service Layer documentation
- Updated `README.md` with complete feature list

---

## [0.9.0] - 2025-01-XX (Pre-existing Features)

### Completed

All core MVP features were implemented prior to v1.0.0:

#### Authentication & Onboarding (3/3)
- ✅ US-001: Magic link registration
- ✅ US-002: Magic link login
- ✅ US-003: 3-step onboarding process

#### User Account Management (4/5)
- ✅ US-004: View user profile
- ✅ US-005: Edit user profile (display name, language, theme)
- ✅ US-006: Change application language (en-US, pl-PL)
- ✅ US-007: Change application theme (30+ DaisyUI themes)

#### Tour Management (5/6)
- ✅ US-009: Create new tour
- ✅ US-010: Display tour list with activity indicators
- ✅ US-011: Display tour details
- ✅ US-012: Edit tour by owner
- ✅ US-013: Delete tour by owner (with confirmation)

#### Participants & Invitations (3/3)
- ✅ US-015: Invite participants via email
- ✅ US-016: Remove participants by owner
- ✅ US-017: Accept tour invitations

#### Voting & Interactions (5/5)
- ✅ US-018: Vote for tour (Like system)
- ✅ US-019: Manage voting (Lock/Unlock by owner)
- ✅ US-020: Add comments to tours
- ✅ US-021: Edit own comments
- ✅ US-022: Delete own comments

#### Archive & Search (3/3)
- ✅ US-023: Automatic tour archiving (pg_cron)
- ✅ US-024: Add tags to archived tours
- ✅ US-025: Search archived tours by tags

---

## Technical Stack

- **Frontend**: Astro 5, React 19, TypeScript 5, Tailwind CSS 4, DaisyUI, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Validation**: React Hook Form + Zod
- **Internationalization**: i18next (en-US, pl-PL)
- **Testing**: Vitest (unit), Playwright (E2E), Chromatic (visual)
- **CI/CD**: GitHub Actions

---

## Links

- [Project Repository](https://github.com/turu/tour-planner)
- [Implementation Plan](.claude/plans/federated-bouncing-graham.md)
- [Missing Features Analysis](.ai/missing-features.md)
- [Account Deletion Guide](.ai/account-deletion-implementation.md)
