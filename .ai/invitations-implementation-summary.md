# Podsumowanie Implementacji Systemu Zaproszeń do Wycieczek

## Data: 2025-11-02

## Przegląd

Zaimplementowano pełny system zapraszania użytkowników (zarówno zarejestrowanych, jak i nowych) do współtworzenia planów wycieczek. System wykorzystuje magic links Supabase Auth oraz automatyczną akceptację zaproszeń po logowaniu/rejestracji.

---

## Zaimplementowane Funkcjonalności

### 1. Baza Danych

#### Migracja: `20251102184243_add_invitation_token_expiry.sql`

- **Dodane kolumny do tabeli `invitations`:**
  - `token` (TEXT, UNIQUE, NOT NULL) - unikalny token do linków zaproszeniowych
  - `expires_at` (TIMESTAMPTZ, NOT NULL) - data wygaśnięcia (domyślnie 7 dni od utworzenia)

- **Funkcja `generate_invitation_token()`:**
  - Trigger przed INSERT automatycznie generuje unikalny 32-znakowy token hex
  - Zapewnia unikalność poprzez sprawdzanie istniejących tokenów (max 10 prób)
  - Ustawia `expires_at` na 7 dni w przyszłości

- **Funkcja `accept_invitation(invitation_token, accepting_user_id)`:**
  - Weryfikuje token i datę wygaśnięcia
  - Sprawdza zgodność email użytkownika z emailem zaproszenia
  - Dodaje użytkownika do tabeli `participants` (z obsługą konfliktów)
  - Zmienia status zaproszenia na 'accepted'
  - Zwraca `tour_id` w przypadku sukcesu

- **RLS Policy:**
  - `"anyone can read invitation by token"` - umożliwia publiczny dostęp do odczytu zaproszenia po tokenie (tylko pending, niewygasłe)

- **Indeksy:**
  - `idx_invitations_token` - dla szybkiego wyszukiwania po tokenie
  - `idx_invitations_expires_at` - dla czyszczenia wygasłych zaproszeń

### 2. Backend API

#### Endpointy API:

**`GET /api/tours/[tourId]/invitations`**

- Zwraca listę wszystkich zaproszeń dla wycieczki
- Tylko właściciel wycieczki może wyświetlić zaproszenia
- Weryfikacja przez `tourService.getTourDetails()`

**`POST /api/tours/[tourId]/invitations`**

- Wysyła zaproszenia na podane adresy email
- Walidacja inputu (Zod schema: `inviteParticipantsCommandSchema`)
- Filtruje istniejących uczestników i pending invitations
- Wysyła email przez Supabase Auth `signInWithOtp`
- Zwraca: `{ sent: [], skipped: [], errors: [] }`

**`DELETE /api/invitations/[invitationId]`**

- Anuluje pending invitation
- Tylko właściciel wycieczki może anulować

**`GET /api/invitations?token={token}`**

- Publiczny endpoint (bez autoryzacji)
- Zwraca szczegóły zaproszenia po tokenie
- Sprawdza wygaśnięcie i status

**`POST /api/invitations/[invitationId]/accept`**

- Akceptuje zaproszenie po ID
- Wymaga autoryzacji użytkownika
- Weryfikuje zgodność email

### 3. Frontend - Komponenty React

#### `InvitationForm.tsx`

- Formularz do wysyłania zaproszeń
- Pole tekstowe z obsługą wielu emaili (rozdzielone przecinkami)
- Używa `useInvitationMutations.sendInvitations()`
- Toast notifications dla sukcesu/błędu

#### `InvitedUsersList.tsx`

- Wyświetla listę zaproszonych użytkowników
- Statusy: pending, accepted, declined
- Przycisk do anulowania pending invitations (tylko dla właściciela)
- Formatowanie daty wygaśnięcia
- Używa `useInvitations()` hook

#### `InviteAcceptanceView.tsx`

- Strona akceptacji zaproszenia (`/invite?token=...`)
- Obsługuje 3 scenariusze:
  1. Użytkownik zalogowany z tym samym emailem - może zaakceptować
  2. Użytkownik zalogowany z innym emailem - komunikat błędu
  3. Użytkownik niezalogowany - przekierowanie do logowania z redirectem
- Wyświetla szczegóły zaproszenia (nazwa wycieczki, zapraszający)
- Po akceptacji: redirect na dashboard z parametrem `invitation_accepted`

#### `TourDetailsView.tsx` (zmodyfikowany)

- Dodano sekcje `InvitationForm` i `InvitedUsersList`
- Widoczne tylko dla właściciela wycieczki

### 4. React Query Hooks

#### `useInvitations(tourId)`

- Hook do pobierania listy zaproszeń dla wycieczki
- Query key: `["invitations", tourId]`

#### `useInvitationMutations()`

- `sendInvitations()` - wysyłanie zaproszeń
- `cancelInvitation()` - anulowanie zaproszenia (z optimistic updates)
- `acceptInvitation()` - akceptacja zaproszenia
  - Invaliduje cache: `["tour", tour_id]`, `["tours"]`, `["invitations", tour_id]`

#### `useTourList()` (zmodyfikowany)

- Dodano logikę wykrywania parametru `invitation_accepted` w URL
- Automatyczne odświeżanie listy wycieczek po akceptacji zaproszenia
- Toast notification po sukcesie

### 5. Email Templates

#### `supabase/templates/invite.html`

- Uniwersalny szablon dla magic links i zaproszeń
- Warunkowa treść w zależności od `Data.is_invitation`
- Wyświetla nazwę zapraszającego (`Data.inviter_name`)
- Stylizowany HTML z responsywnym designem
- Template używa zmiennych Supabase:
  - `{{ .ConfirmationURL }}` - link do akceptacji
  - `{{ .Data.is_invitation }}` - flaga zaproszenia
  - `{{ .Data.inviter_name }}` - nazwa zapraszającego

### 6. Automatyczna Akceptacja Zaproszeń

#### `src/pages/auth/confirm.astro`

- Middleware automatycznie wykrywa token zaproszenia w `redirectPath`
- Format: `/invite?token={token}`
- Po udanym logowaniu/rejestracji:
  1. Wywołuje `supabase.rpc("accept_invitation", { ... })`
  2. W przypadku sukcesu: redirect na dashboard z `invitation_accepted={tourId}`
  3. W przypadku błędu: kontynuuje na stronę `/invite` (użytkownik może zaakceptować ręcznie)

### 7. TypeScript Types

#### Zaktualizowane w `src/types.ts`:

- `InvitationDto` - dodano `token?` i `expires_at`
- `InviteParticipantsCommand` - command do wysyłania zaproszeń
- `SendInvitationsResponse` - response z podziałem na sent/skipped/errors
- `InvitationByTokenDto` - szczegóły zaproszenia po tokenie
- `AcceptInvitationResponse` - response po akceptacji

### 8. Validatory

#### `src/lib/validators/invitation.validators.ts`:

- `inviteParticipantsCommandSchema` - walidacja listy emaili
- `invitationIdSchema` - walidacja UUID
- `invitationTokenSchema` - walidacja formatu tokenu (32-64 znaki)

### 9. Internationalization

#### Dodane klucze w `public/locales/*/tours.json`:

- `invitations.sendSuccess` / `sendError`
- `invitations.cancelSuccess` / `cancelError`
- `invitations.acceptSuccess` / `acceptError`
- `invitations.status.*` (pending, accepted, declined)
- `invitations.expiresAt`
- `invitations.acceptance.*` (titles, messages dla różnych scenariuszy)

---

## Flow Użytkownika

### Scenariusz 1: Nowy użytkownik

1. Właściciel wycieczki wysyła zaproszenie na email
2. Użytkownik otrzymuje email z magic linkiem (spersonalizowanym jako zaproszenie)
3. Kliknięcie linku → `/auth/confirm` → automatyczne utworzenie konta
4. Middleware wykrywa token w redirectPath → wywołuje `accept_invitation()`
5. Redirect na dashboard → wycieczka widoczna na liście

### Scenariusz 2: Istniejący użytkownik (ten sam email)

1. Właściciel wysyła zaproszenie
2. Użytkownik otrzymuje email z magic linkiem
3. Kliknięcie linku → logowanie
4. Automatyczna akceptacja zaproszenia
5. Redirect na dashboard

### Scenariusz 3: Istniejący użytkownik (inny email)

1. Właściciel wysyła zaproszenie na email X
2. Użytkownik loguje się emailem Y
3. Na stronie `/invite` widzi komunikat o niezgodności emaili
4. Może wylogować się i zalogować właściwym emailem

---

## Planowane rozszerzenia (stan na 2025-11-18)

Zgodnie z dokumentem `.ai/feature-gap/plan.md` planujemy następujące usprawnienia systemu zaproszeń:

- **TTL 14 dni + status `expired`:** wydłużenie `expires_at` do 14 dni i dodanie stanu `expired`, aby UI mogło pokazywać, że link jest nieważny bez usuwania rekordu (audyt).
- **Nowy cron `cleanup_invitations`:** codzienny job (04:00 UTC) aktualizujący status pendingów z przekroczonym `expires_at` na `expired` oraz logujący wynik.
- **Obsługa `decline/resend`:** dodatkowe endpointy `POST /api/invitations/{id}/accept|decline|resend`, które aktualizują status i odświeżają cache w React Query.
- **Ujednolicone wejście `/invite/{token}`:** już istniejąca strona pozostaje jedynym miejscem akceptacji; backend dodaje walidację tokenu i dopasowanie e-maila przed dołączeniem do `participants`.
- **Monitoring i KPI:** raportowanie wskaźników (liczba wygasłych zaproszeń, konwersja accepted/pending) w tym samym pipeline co nowe joby `pg_cron`.

Te zmiany zostaną zsynchronizowane z roadmapą w sekcji „Feature Gap Alignment (2025-11-18)”.

## Konfiguracja

### `supabase/config.toml`

- Template magic link: `./supabase/templates/invite.html`
- Site URL: `http://localhost:3000`
- Additional redirect URLs: zawiera `/invite` route
- Email testing: Inbucket/Mailpit na porcie 54324

### Environment Variables

- `PUBLIC_SUPABASE_URL` - używane do budowania URL-i zaproszeń
- `SUPABASE_SERVICE_ROLE_KEY` - dla admin client (wysyłanie emaili)

---

## Pliki Utworzone/Zmodyfikowane

### Nowe pliki:

- `supabase/migrations/20251102184243_add_invitation_token_expiry.sql`
- `src/lib/services/invitation.service.ts`
- `src/lib/validators/invitation.validators.ts`
- `src/lib/hooks/useInvitations.ts`
- `src/lib/hooks/useInvitationMutations.ts`
- `src/components/tours/InvitationForm.tsx`
- `src/components/tours/InvitedUsersList.tsx`
- `src/components/invitations/InviteAcceptanceView.tsx`
- `src/pages/api/tours/[tourId]/invitations.ts`
- `src/pages/api/invitations/[invitationId].ts`
- `src/pages/api/invitations/index.ts`
- `src/pages/api/invitations/[invitationId]/accept.ts`
- `src/pages/[...locale]/invite.astro`

### Zmodyfikowane pliki:

- `src/types.ts` - dodane DTOs dla zaproszeń
- `src/components/tours/TourDetailsView.tsx` - dodano sekcje zaproszeń
- `src/components/tours/TourList.tsx` - dodano auto-refresh po akceptacji
- `src/pages/auth/confirm.astro` - dodano auto-accept logic
- `supabase/templates/invite.html` - uniwersalny template z warunkową treścią
- `supabase/config.toml` - dodano redirect URLs
- `public/locales/*/tours.json` - dodano klucze tłumaczeń

---

## Znane Ograniczenia / Do Usprawnienia

1. **Email Template Variables:**
   - Supabase może nie przekazywać custom `data` do szablonu email w taki sposób, jak zakładamy
   - Wymaga weryfikacji w dokumentacji Supabase Auth templates
   - Możliwe, że trzeba użyć zmiennej środowiskowej `GOTRUE_MAILER_TEMPLATES_INVITE` zamiast/miejsca `MAGIC_LINK`

2. **Personalizacja Email:**
   - Obecnie próbujemy przekazać `data: { is_invitation: true, inviter_name: ... }` do `signInWithOtp`
   - Może nie działać - Supabase może nie przekazywać custom data do template
   - **Wymaga przetestowania** - jeśli nie działa, trzeba znaleźć alternatywne rozwiązanie

3. **Rate Limiting:**
   - Endpoint POST `/api/tours/[tourId]/invitations` nie ma dedykowanego rate limitingu
   - Komentarz w kodzie: "TODO: Add rate limiting for invitations"
   - Sugerowane: max 10 zaproszeń na godzinę per tour

4. **Cleanup Expired Invitations:**
   - W DB plan jest wzmianka o `pg_cron` job do czyszczenia wygasłych zaproszeń
   - Obecnie nie zaimplementowane

5. **Error Handling:**
   - Jeśli email nie wyśle się, invitation record pozostaje w bazie
   - W production można rozważyć rollback lub retry mechanism

6. **Internationalization Email Template:**
   - Template `invite.html` jest obecnie tylko w języku angielskim
   - Można rozważyć multi-language templates w przyszłości

---

## Testowanie

### Local Development:

1. Uruchom `supabase start`
2. Inbucket/Mailpit dostępny na `http://localhost:54324`
3. Test flow:
   - Utwórz wycieczkę jako owner
   - Wyślij zaproszenie na nowy email
   - Sprawdź email w Inbucket
   - Kliknij link → powinno automatycznie założyć konto i zaakceptować zaproszenie
   - Sprawdź dashboard → wycieczka powinna być widoczna

### Edge Cases do Przetestowania:

- Zaproszenie wygasłe (po 7 dniach)
- Zaproszenie już zaakceptowane (próba ponownej akceptacji)
- Email już jest uczestnikiem wycieczki
- Właściciel próbuje zaprosić samego siebie
- Anulowanie zaproszenia
- Zaproszenie na email, który już ma konto (ale inny user jest zalogowany)

---

## Następne Kroki / TODO

1. **Weryfikacja Email Template:**
   - Przetestować czy custom `data` przekazywane do `signInWithOtp` faktycznie trafia do template
   - Jeśli nie - sprawdzić `GOTRUE_MAILER_TEMPLATES_*` environment variables
   - Możliwe że trzeba użyć osobnego endpointu/template dla zaproszeń

2. **Rate Limiting:**
   - Dodać dedykowany rate limit dla wysyłki zaproszeń (np. 10/hour/tour)

3. **Cleanup Job:**
   - Zaimplementować `pg_cron` job do automatycznego usuwania wygasłych pending invitations

4. **Email Failures:**
   - Rozważyć rollback invitation record jeśli email nie został wysłany
   - Lub dodać retry mechanism

5. **UI Improvements:**
   - Dodać loading states w `InvitationForm`
   - Dodać lepsze error messages
   - Możliwe bulk operations (anulowanie wielu zaproszeń)

6. **Security:**
   - Rozważyć dodatkowe zabezpieczenia przed spam (np. CAPTCHA dla większej liczby zaproszeń)
   - Audit log dla zaproszeń (kto zaprosił, kiedy, status)

---

## Ważne Uwagi Techniczne

1. **Token Generation:**
   - Token jest generowany automatycznie przez trigger przed INSERT
   - Jeśli `token` jest już podany przy INSERT, trigger go nie nadpisze
   - Format: 32 znaki hex (16 bajtów)

2. **RLS Policies:**
   - Policy dla publicznego odczytu po tokenie jest restrykcyjna (tylko pending, niewygasłe)
   - Zaproszenia są widoczne tylko dla właściciela wycieczki (normalne SELECT)

3. **Auto-Accept Logic:**
   - Działa tylko jeśli token jest w `redirectPath` po `/auth/confirm`
   - Jeśli użytkownik przejdzie bezpośrednio na `/invite?token=...`, auto-accept nie zadziała
   - W takim przypadku użytkownik musi kliknąć przycisk "Accept"

4. **Cache Invalidation:**
   - Po akceptacji zaproszenia, invalidowane są:
     - `["tour", tour_id]` - szczegóły wycieczki
     - `["tours"]` - lista wycieczek (wszystkie statusy)
     - `["invitations", tour_id]` - lista zaproszeń
   - Dodatkowo, `TourList` component wykrywa parametr URL `invitation_accepted` i wymusza refetch

5. **Email Flow:**
   - Używamy `signInWithOtp` zamiast dedykowanego `inviteUserByEmail`
   - Powód: zachowujemy spójny flow logowania i auto-accept
   - Template jest uniwersalny i rozpoznaje kontekst zaproszenia przez `Data.is_invitation`

---

## Dokumentacja do Sprawdzenia

- Supabase Auth Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Supabase Auth Admin API: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Go Template Syntax (używane w email templates): https://pkg.go.dev/text/template

---

## Kontakt / Wsparcie

Jeśli potrzebujesz kontynuować pracę nad tym feature:

1. Najpierw przetestuj obecny flow end-to-end
2. Sprawdź czy email template faktycznie otrzymuje custom data
3. Jeśli nie - sprawdź alternatywne rozwiązania w dokumentacji Supabase
4. Zaktualizuj ten dokument po wprowadzeniu zmian
