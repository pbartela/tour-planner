# Feature Gap Implementation Prompt

You are an experienced Astro + React + TypeScript engineer working on the Tour Planner repo located at `/home/turu/Repositories/tour-planner`. Your task is to implement the high-priority feature gaps defined in `.ai/feature-gap/plan.md` (2025-11-18). Carefully follow the repository rules described in `.ai/api-plan.md`, `.ai/db-plan.md`, `.ai/prd.md`, `.ai/ui-plan.md`, and `.ai/implementation-roadmap.md`.

---

## Goals
Implement and ship the following features end-to-end (DB, API, UI, tests):

1. **Real activity tracking & “new activity” badge**
2. **Automatic archiving cron job + read-only enforcement**
3. **Invitation lifecycle completion (accept/decline/resend + automatic `expired`)**
4. **Tagging and multi-tag search for archived tours**
5. **Two-step account deletion with email confirmation and audit log**

Each feature must satisfy the acceptance criteria captured in `.ai/feature-gap/plan.md`. The roadmap now treats these items as blockers for parity with the PRD and MVP.

---

## Detailed Requirements (condensed)

### 1. Activity tracking
- DB: tables `tour_activity` (`id`, `tour_id`, `type`, `actor_id`, `created_at`) + `tour_activity_reads` (`tour_id`, `user_id`, `last_read_at`), RLS built on `public.is_participant`.
- Backend: when comments or votes change, record activity entries. Endpoint `POST /api/tours/{tourId}/activity/read` upserts last_read timestamp. `/api/tours` must return accurate `has_new_activity`.
- Frontend: `TourDetailsView` automatically calls the read endpoint on mount; `TourList` uses returned booleans to show badges (UI exists, just wire to real data).
- Tests: unit tests for services + Playwright scenario verifying badge toggles upon new comment.

### 2. Automatic archiving
- DB: function `archive_finished_tours()` that flips `status` to `archived` whenever `end_date < now()`. Schedule cron at 03:00 UTC. Log executions.
- API/UI: editing endpoints reject changes for archived tours; client surfaces read-only state. Dashboard switches between active vs archived lists.
- Tests: integration test for Cron function (SQL unit) + e2e verifying a forced archive becomes read-only.

### 3. Invitation lifecycle w/ cleanup
- Invitations expire after 14 days → set `expires_at` accordingly and introduce status `expired` (stored, not deleted).
- Cron `cleanup_invitations()` at 04:00 UTC marks overdue `pending` rows as `expired`.
- Endpoint set: `POST /api/invitations/{id}/accept`, `/decline`, `/resend`; UI already surfaces statuses, ensure React Query cache refresh.
- Ensure `/invite/{token}` page validates token and email match before joining participants.
- Tests: service layer coverage + e2e scenario from invite → accept and expired path.

### 4. Tagging and search
- Only archived tours accept tags; users must be participants (current or former). Support API filtering via `GET /api/tours?status=archived&tags=tag1,tag2` (logical AND).
- UI: combobox with autosuggest (existing tags) + manual entry, ability to add/remove tags, filter list inline.
- Tests: unit for tag parser, e2e verifying tag-based filtering.

### 5. Two-step account deletion
- Flow: user opens `/profile`, checks confirmation box, types phrase (e.g. “DELETE”), triggers email with signed token valid 24h. Endpoint `DELETE /api/profiles/me?token=...` uses Supabase Admin API to remove the user, then logs to `account_deletion_audit` (retain 30 days). Send final confirmation email.
- After deletion, session cleared and user redirected to goodbye page.
- Tests: backend unit tests for token validation + e2e happy path.

---

## Constraints & Notes
- Respect all RLS constraints. Avoid self-referential policies; reuse helper functions from `db-plan`.
- Tech stack: Astro 5, React 19, TypeScript 5, Tailwind 4 + DaisyUI 5, Supabase backend.
- Reuse components documented in `.cursor/rules/components/COMPONENTS_REFERENCE.md` before creating new ones.
- Minimal custom CSS; prefer DaisyUI classes. Keep files ASCII unless already using other characters.
- Ensure internationalization support (`en-US`, `pl-PL`) for new UI strings.
- Update docs affected by each change (`api-plan`, `db-plan`, `implementation-roadmap`, `invitations-implementation-summary`, etc.).
- Maintain existing coding patterns (React Query hooks, service layers, validators).

---

## Deliverables
1. Production-ready code implementing the five features end-to-end.
2. Database migrations + Supabase cron configuration.
3. Updated documentation and specs to reflect new capabilities.
4. Automated tests (unit + Playwright) covering new behaviors.
5. Short summary of changes, verification steps, and any known follow-up items.

---

## Testing Expectations
- Run relevant unit tests (Vitest) per affected modules.
- Add Playwright scenarios for: activity badge flow, auto-archive read-only, invite acceptance & expiry, tag filtering, account deletion.
- Verify Supabase cron jobs locally (manual invocation) and document operational steps.

---

## References
- `.ai/feature-gap/plan.md`

---

## Post-Implementation Cleanup
- Po zakończeniu wszystkich prac usuń cały folder `.ai/feature-gap/` oraz wszystkie znajdujące się w nim pliki pomocnicze, aby w repo nie zostawały tymczasowe instrukcje.
- `.ai/implementation-roadmap.md` (Feature Gap Alignment section)
- `.ai/invitations-implementation-summary.md`
- `.ai/api-plan.md`, `.ai/db-plan.md`, `.ai/prd.md`, `.ai/ui-plan.md`
- Repo structure notes in the workspace rules

Follow the plan meticulously, keep commits granular, and update the roadmap after each feature lands.

