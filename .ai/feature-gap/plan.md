## 1. Podsumowanie i lista zidentyfikowanych funkcji
- `api-plan.md` nadal traktuje `has_new_activity` jako placeholder i nie opisuje realnego źródła danych, choć PRD (§3.5, US-010/020) wymaga widocznych wskaźników nowych komentarzy i głosów.
- `db-plan.md` określa automatyczne archiwizowanie i czyszczenie zaproszeń jako „Planned Features”, co oznacza brak działających `pg_cron` jobów.
- `ui-plan.md` definiuje tagowanie oraz wyszukiwarkę archiwów, ale API i UI nie oferują jeszcze kompletnego flow (BRD US-024/025).
- `prd.md` (US-008) oczekuje dwustopniowego usuwania konta z potwierdzeniem e-mail i transferem własności, a `mvp.md` wymienia to jako element podstawowego zestawu funkcji – brak dedykowanego endpointu w `api-plan.md`.
- `.ai/invitations-implementation-summary.md` opisuje istniejący UI/UX, ale nie ma mechanizmu oznaczania `expired` po 14 dniach ani dedykowanego joba do czyszczenia pendingów.

**Brakujące funkcje do wdrożenia:**
1. **Śledzenie aktywności i realny wskaźnik „Nowa aktywność”.**
2. **Automatyczne archiwizowanie wycieczek po `end_date`.**
3. **Tagowanie archiwów i wyszukiwarka po wielu tagach.**
4. **Dwustopniowe usuwanie konta z potwierdzeniem e-mail i logami.**
5. **Pełny cykl życia zaproszeń (akceptacja/odrzucenie + automatyczne `expired`).**

---

## 2. Priorytetyzacja (metoda RICE)

| Funkcja | Reach (%) | Impact (1-3) | Confidence | Effort (dni) | RICE | Priorytet | Uzasadnienie |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Wskaźnik aktywności | 80 | 3.0 | 0.70 | 6 | 28.0 | Must | Dashboard bez tej funkcji łamie PRD US-010/020. |
| 2. Auto-archiwizacja | 60 | 2.5 | 0.60 | 5 | 18.0 | Must | `db-plan.md` i PRD US-023 wymagają automatu; ręczne obejścia nie istnieją. |
| 5. Cykl zaproszeń | 50 | 2.0 | 0.50 | 6 | 8.3 | Must | UI już jest, ale brak backendowego cleanupu i statusu `expired`. |
| 3. Tagowanie archiwów | 40 | 2.0 | 0.60 | 7 | 6.9 | Should | Funkcja z PRD US-024/025 poprawia wyszukiwanie, zależy od archiwów. |
| 4. Usuwanie konta | 25 | 2.5 | 0.50 | 5 | 6.25 | Should | Wymaganie PRD US-008; niższy reach, ale potrzebne dla zgodności prawnej. |

---

## 3. Szczegółowy plan wdrożenia

### 3.1 Śledzenie aktywności i wskaźnik „Nowa aktywność”
**Opis:** Rejestrowanie zdarzeń komentarzy i głosów w `tour_activity` oraz oznaczanie ich jako przeczytane przy otwarciu widoku szczegółów (bez dodatkowych przycisków). Na razie obejmujemy tylko komentarze i głosy, realtime zostaje w gestii React Query.

**Kryteria akceptacji**
- Tabele: `tour_activity` (`id`, `tour_id`, `type`, `actor_id`, `created_at`) i `tour_activity_reads` (`tour_id`, `user_id`, `last_read_at`).
- `has_new_activity` w `/api/tours` = `true`, gdy istnieje zdarzenie młodsze niż `last_read_at` lub brak rekordu w `tour_activity_reads`.
- Wyświetlenie `TourDetailsView` automatycznie wywołuje `POST /api/tours/{id}/activity/read` i czyści badge.
- E2E test (Playwright) symuluje nowy komentarz i weryfikuje pojawienie się / zniknięcie badge.

**Zadania**
- DB/Backend: migracja z obiema tabelami, RLS opartym o `public.is_participant`, event emitters w serwisach komentarzy/głosów, endpoint `POST /api/tours/{id}/activity/read`.
- Frontend: hook React Query oznaczający aktywność przy wejściu, odświeżanie listy tur, brak zmiany w UI (badge już istnieje).
- QA: testy jednostkowe serwisów + scenariusz e2e.

**Szacowany czas:** ~6 dni roboczych.
**Zależności:** brak, może działać równolegle z innymi zadaniami.

---

### 3.2 Automatyczne archiwizowanie wycieczek
**Opis:** `pg_cron` uruchamiany codziennie o 03:00 UTC, który zmienia `status` na `archived` po minięciu `end_date`, a API/UI respektują stan tylko-do-odczytu.

**Kryteria akceptacji**
- Funkcja SQL `archive_finished_tours()` aktualizuje wszystkie wycieczki z `end_date < now()` i `status = 'active'`.
- Job `SELECT archive_finished_tours();` dodany do `cron.job` z logowaniem rezultatów.
- `/api/tours` filtruje i blokuje edycję archiwalnych tur (walidacja w serwisie + RLS).
- Widok `/archive` pokazuje tylko archiwa; dashboard ma przełącznik Active/Archived.

**Zadania**
- DB: migracja dodająca funkcję, indeksy pomocnicze oraz wpis do `pg_cron`.
- Backend: walidacje i ewentualne 403 przy próbie edycji archiwum.
- Frontend: przełącznik statusu w `TourList`, ujednolicenie widoku `/archive`.
- QA/Ops: test wymuszonego archiwum + monitoring joba.

**Szacowany czas:** ~5 dni.
**Zależności:** aktywność (3.1) może działać niezależnie, ale tagowanie (3.3) zależy od archiwów.

---

### 3.3 Tagowanie archiwów i wyszukiwarka
**Opis:** Użycie tabel `tags`/`tour_tags` z `db-plan.md` do dodawania tagów przez uczestników archiwalnych tur oraz filtrowania po wielu tagach (logiczne AND). UI korzysta z comboboxu z autosugestią i możliwością dopisania nowego tagu.

**Kryteria akceptacji**
- Tylko uczestnicy (również były właściciel) mogą dodawać/usuwać tagi na archiwum.
- API wspiera zapytania `GET /api/tours?status=archived&tags=summer,2026` → zwraca tylko tury zawierające wszystkie wymienione tagi.
- Widok `/archive` ma combobox + listę tagów (`badge`), umożliwia dodawanie i filtrowanie bez przeładowania strony.
- Test e2e: dodanie tagu, filtrowanie po dwóch tagach, sprawdzenie uprawnień.

**Zadania**
- Backend: rozszerzenie istniejących endpointów (`POST/DELETE /tags`, filtr w liście tur, walidacja tagów), indeksy pod wielokrotne joiny.
- Frontend: komponent `TagCombobox`, nowy hook do pobierania tagów, integracja z `TourList`.
- QA: testy walidacji (duplikaty, spacje), e2e.

**Szacowany czas:** ~7 dni.
**Zależności:** wymaga zakończonej auto-archiwizacji (3.2).

---

### 3.4 Dwustopniowe usuwanie konta
**Opis:** Jeden endpoint `DELETE /api/profiles/me`, który wymaga: (1) wpisania frazy w modalu na `/profile`, (2) kliknięcia linku potwierdzającego w e-mailu. Po sukcesie Supabase Admin API usuwa użytkownika, a baza korzysta z istniejących triggerów przejmujących własność. Logi trzymamy 30 dni.

**Kryteria akceptacji**
- Strona profilu otwiera modal z checkboksem + polem na frazę (np. „DELETE”); brak innych miejsc uruchamiających flow.
- Po potwierdzeniu wysyłany jest mail z linkiem (`ACCOUNT_DELETE_CONFIRM_URL`) ważnym 24h.
- Wywołanie linku trafia w `DELETE /api/profiles/me?token=...` → usuwa konto, wysyła końcowe potwierdzenie, wylogowuje użytkownika.
- Retencja: tabela audit (np. `account_deletion_audit`) przechowuje rekordy przez 30 dni (user_id, timestamp, result).

**Zadania**
- Backend: endpoint, generowanie tokenu (JWE lub signed JWT), integracja z Supabase Admin API, logowanie, e-mail potwierdzający.
- Frontend: `DeleteAccountModal` (DaisyUI), obsługa stanów ładowania/błędów, przekierowanie po sukcesie.
- QA/Security: test flow happy-path + próba użycia tokenu drugi raz.

**Szacowany czas:** ~5 dni.
**Zależności:** niezależne, ale powinno nastąpić po ustabilizowaniu archiwów, aby trigger transferu działał przewidywalnie.

---

### 3.5 Cykl życia zaproszeń (akceptacja, odrzucenie, cleanup)
**Opis:** UI `InvitedUsersList` już pokazuje statusy, więc skupiamy się na backendzie: potwierdzenie tokenu na `/invite/{token}`, możliwość oznaczenia `declined`, automatyczne `expired` po 14 dniach i job `cleanup_invitations`. Linki nadal prowadzą do `/invite/{token}`.

**Kryteria akceptacji**
- Tabela `invitations` posiada statusy `pending`, `accepted`, `declined`, `expired`; `expires_at` ustawiane na 14 dni.
- Endpointy: `POST /api/invitations/{id}/accept|decline`, `POST /api/invitations/{id}/resend` (opcjonalnie) – wszystkie aktualizują status i invalidują cache.
- Cron `cleanup_invitations()` ustawia `status = 'expired'` i wysyła ewentualne notyfikacje; rekord pozostaje w DB dla audytu.
- Akceptacja działa dla użytkownika zalogowanego lub świeżo zarejestrowanego (istniejąca strona `/invite/{token}`).

**Zadania**
- Backend: modyfikacja migracji (wydłużenie TTL do 14 dni), nowe RPC lub endpointy accept/decline/resend, cron z logowaniem.
- Email: aktualizacja szablonu (informacja o 14-dniowym TTL, linki decline).
- QA: test e2e od zaproszenia do akceptacji, test wygaszenia (symulacja czasu).

**Szacowany czas:** ~6 dni.
**Zależności:** może być równoległe z 3.2; UI już dostępne.

---

## 4. Harmonogram wdrożenia (iteracje 5-dniowe)

| Tydzień | Zakres | Zależności | Uwagi |
| --- | --- | --- | --- |
| 1 | 3.1 Wskaźnik aktywności + start migracji 3.2 | brak | Najpierw backend/tabele, potem integracja z UI. |
| 2 | Dokończenie 3.2 + backend 3.5 (tokeny, endpointy, cron) | 3.1 częściowo | Job `archive_finished_tours` uruchamiamy pod koniec tygodnia po testach. |
| 3 | Frontend/integracje 3.5 + rozpoczęcie 3.3 (API tagów) | 3.2 gotowe | Zaproszenia testujemy e2e równolegle. |
| 4 | 3.3 UI + QA, start 3.4 backend | 3.3 zależy od archiwów | Combobox tagów i filtry zakończyć przed usunięciem kont. |
| 5 | 3.4 frontend + regresje wszystkich funkcji | 3.4 backend | Bufer na poprawki + przygotowanie release notes. |

Zależności kluczowe: 3.2 → 3.3, reszta równoległa. W razie poślizgu 3.5 można przesunąć na tydzień 4 (UI już gotowe).

---

## 5. Ryzyka i plan mitygacji
- **RLS na nowych tabelach aktywności:** użyć `SECURITY DEFINER` helperów (`public.is_participant`) i testów regresyjnych.
- **`pg_cron` niedostępny w środowisku lokalnym/self-host:** dodać fallback – manualny `npm run archive-tours` wywołujący tę samą funkcję; opisać w README.
- **Zwiększona ilość joinów przy filtrowaniu tagów:** konieczne indeksy (`tour_tags(tag_id)`, `tour_tags(tour_id)`) i paginacja.
- **Flow usuwania konta wymaga niezawodnego e-maila:** monitorować wskaźnik dostarczalności (Supabase logs), trzymać webhook retry.
- **Zaproszenia i auto-akceptacja mogą nadawać dostęp złym użytkownikom:** token podpisany JWE + dopasowanie e-maila + limit prób.
- **Retencja logów 30 dni:** upewnić się, że audit table nie rośnie bez końca (cron `DELETE FROM account_deletion_audit WHERE created_at < now() - interval '30 days'`).

---

## KPI i monitorowanie
- % aktywnych tur z poprawnie zadziałanym wskaźnikiem (tury z `has_new_activity` = true w ostatnich 7 dniach, które użytkownik odwiedził < 24h).
- Średni czas od `end_date` do archiwizacji (docelowo < 24h).
- % archiwów z ≥1 tagiem oraz średnia liczba tagów na turę.
- Wskaźnik konwersji zaproszeń (accepted / pending) oraz liczba automatycznie wygaszonych zaproszeń.
- Liczba pomyślnie zakończonych procesów usuwania konta vs. błędy (z audit logów).

---

## Env & Ops
- `INVITATION_TOKEN_TTL_DAYS=14` – nowa stała synchronizowana z cronem.
- `INVITE_ACCEPT_REDIRECT` – ścieżka, na którą trafia użytkownik po akceptacji (np. `/dashboard?invitation_accepted=1`).
- `ACCOUNT_DELETE_CONFIRM_URL` + `ACCOUNT_DELETE_JWT_SECRET` – generowanie i walidacja linków kasujących konto.
- Dwa cron joby w Supabase:
  - `archive_finished_tours` (03:00 UTC, codziennie).
  - `cleanup_invitations` (04:00 UTC, codziennie) + opcjonalny `cleanup_account_deletion_audit`.
- Monitoring: logi jobów kierować do istniejącego stacku (Supabase logs + Slack webhook, jeżeli ustawiony).

---

## Retencja logów
- `account_deletion_audit` (30 dni, potem auto-purge).
- `cron_job_logs` – przechowywać min. 14 dni dla weryfikacji archiwizacji oraz cleanupów zaproszeń.
- Wszelkie tokeny usuwania konta przechowywać tylko w formie skrótu (sha-256) w tabeli tymczasowej, również z TTL 24h.

---

## Powiązania z istniejącymi dokumentami
- **`api-plan.md`** – wymaga aktualizacji sekcji Tours/Invitations po wdrożeniu (nowe pola `has_new_activity`, `tags`, status `expired`, endpoint `DELETE /profiles/me`).
- **`db-plan.md`** – rozszerzenia sekcji „Planned Features” o konkretne migracje i joby z tego planu.
- **`.ai/implementation-roadmap.md`** – dodano sekcję „Feature Gap Alignment (2025-11-18)” wskazującą na niniejszy dokument jako źródło prawdy dla priorytetów.
- **`.ai/invitations-implementation-summary.md`** – zaktualizowana o nowy cykl życia zaproszeń i cleanup.
- **`ui-plan.md`** – będzie wymagał odnotowania comboboxu tagów oraz modalu usuwania konta po wdrożeniu.

---

**Status dokumentu:** przygotowano na potrzeby modeli LLM, wszystkie czasy są przybliżone i mogą być użyte jako wejście do generowania zadań implementacyjnych. Po ukończeniu implementacji usuń cały folder `.ai/feature-gap/`, aby w repozytorium nie zostawiać tymczasowych instrukcji.

