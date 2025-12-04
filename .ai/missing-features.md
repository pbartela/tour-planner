# Brakujące Funkcjonalności - Tour Planner

**Data aktualizacji:** 2025-01-04
**Status:** Wszystkie funkcje zaimplementowane! ✅

---

## 📋 Podsumowanie

Projekt spełnia wymagania zaliczenia i zawiera wszystkie opcjonalne funkcjonalności.

**Status:** 0 z 26 User Stories niezaimplementowanych (100% kompletne) ✅

**Ostatnio zaimplementowane:**
- ✅ US-008: Deleting User Account
- ✅ US-014: Leaving Tour by Participant (już było)
- ✅ US-026: Transfer of Tour Ownership (już było)

---

## ✅ Niedawno Zaimplementowane Funkcjonalności

### US-008: Deleting User Account ✅

**Status:** ✅ IMPLEMENTED
**Data implementacji:** 2025-01-04
**Priorytet:** Should (opcjonalne, ale zaimplementowane)

**Opis:**
Użytkownik może trwale usunąć swoje konto wraz z wszystkimi danymi poprzez dwustopniową weryfikację.

**Zaimplementowane funkcje:**
- ✅ Dwustopniowe potwierdzenie (checkbox + wpisanie DELETE/USUŃ)
- ✅ Usunięcie wszystkich danych osobowych z systemu
- ✅ Automatyczny transfer własności wycieczek (US-026)
- ✅ Anonimizacja komentarzy
- ✅ Usunięcie awatara z storage
- ✅ Usunięcie tour_activity records
- ✅ Wylogowanie i przekierowanie użytkownika
- ✅ Wsparcie dla dwóch języków (en-US, pl-PL)

**Zaimplementowane pliki:**
- ✅ `src/components/profile/DeleteAccountDialog.tsx` (NOWY)
- ✅ `src/lib/hooks/useAccountMutations.ts` (NOWY)
- ✅ `src/lib/services/profile.service.ts` (dodano deleteAccount)
- ✅ `src/pages/api/profiles/me.ts` (dodano DELETE handler)
- ✅ `src/components/profile/ProfileView.tsx` (dodano Danger Zone)
- ✅ `public/locales/en-US/common.json` (dodano tłumaczenia)
- ✅ `public/locales/pl-PL/common.json` (dodano tłumaczenia)

**Testy:**
- ✅ 13/13 unit tests passing (`profile.service.test.ts`)
- ✅ 8 E2E tests (`tests/e2e/profile/delete-account.spec.ts`)
  - Testy UI (checkbox + text input validation)
  - Testy błędów (graceful error handling)
  - Testy lokalizacji (en-US i pl-PL)

**Czas implementacji:** 5 godzin

---

### US-014: Leaving Tour by Participant ✅

**Status:** ✅ ALREADY IMPLEMENTED
**Priorytet:** Niski

**Opis:**
Uczestnik wycieczki może opuścić wycieczkę poprzez przycisk "Leave Tour".

**Zaimplementowane funkcje:**
- ✅ Przycisk "Leave tour" na stronie wycieczki (dla uczestników, nie właścicieli)
- ✅ Dialog potwierdzenia akcji
- ✅ Usunięcie z listy uczestników
- ✅ Utrata dostępu do szczegółów wycieczki
- ✅ Pełna obsługa błędów

**Zaimplementowane pliki:**
- ✅ `src/components/tours/ParticipantsList.tsx` (zawiera UI)
- ✅ `src/lib/hooks/useParticipantMutations.ts` (useRemoveParticipantMutation)
- ✅ `src/pages/api/tours/[tourId]/participants/[userId].ts` (DELETE endpoint)
- ✅ `src/lib/services/participant.service.ts` (removeParticipant)

**Uwagi:**
- Funkcjonalność była już w pełni zaimplementowana
- Backend i UI działają poprawnie
- Autoryzacja: uczestnik może usunąć siebie, właściciel może usunąć innych

---

### US-026: Transfer of Tour Ownership ✅

**Status:** ✅ ALREADY IMPLEMENTED (via database trigger)
**Priorytet:** Edge case

**Opis:**
Gdy właściciel wycieczki usuwa swoje konto, własność wycieczki jest automatycznie przekazana innemu uczestnikowi.

**Zaimplementowane funkcje:**
- ✅ Automatyczny transfer własności przy usuwaniu konta właściciela
- ✅ Nowy właściciel to uczestnik, który dołączył jako pierwszy (posortowane po joined_at)
- ✅ Wszyscy uczestnicy pozostają bez zmian
- ✅ Jeśli właściciel był jedynym uczestnikiem, wycieczka jest usuwana

**Zaimplementowane pliki:**
- ✅ `supabase/migrations/20251014100000_initial_schema.sql` (funkcja handle_user_deletion)
- ✅ Trigger `on_auth_user_deleted` automatycznie wywołuje transfer

**Logika transferu:**
```sql
-- Z funkcji handle_user_deletion()
new_owner_id := (
  select user_id from participants
  where tour_id = rec.id and user_id != old.id
  order by joined_at asc
  limit 1
);

if new_owner_id is not null then
  update tours set owner_id = new_owner_id where id = rec.id;
else
  delete from tours where id = rec.id;
end if;
```

**Uwagi:**
- Funkcjonalność była już w pełni zaimplementowana jako trigger bazodanowy
- Działa automatycznie przy usuwaniu użytkownika
- Testowane jako część US-008

---

## ❌ Niezaimplementowane Funkcjonalności

**BRAK** - wszystkie funkcjonalności są zaimplementowane! 🎉

---

## 📊 Archiwum - Stare Opisy (Dla Referencji)  
**Priorytet:** Should (nie Must)  
**Wpływ na zaliczenie:** ❌ Nie blokuje zaliczenia

**Opis:**
Użytkownik powinien mieć możliwość trwałego usunięcia swojego konta wraz z wszystkimi danymi.

**Wymagania:**
- Dwustopniowe potwierdzenie (checkbox + wpisanie hasła/frazy)
- Usunięcie wszystkich danych osobowych z systemu
- Automatyczny transfer własności wycieczek (zobacz US-026)

**Szacowany czas implementacji:** 4-5 godzin

**Pliki do utworzenia/modyfikacji:**
- `src/pages/api/profiles/me.ts` (dodanie DELETE handler)
- `src/lib/services/profile.service.ts` (metoda deleteAccount)
- `src/components/profile/ProfileView.tsx` (przycisk usuwania)
- `src/components/profile/DeleteAccountDialog.tsx` (NOWY - dialog potwierdzenia)

**Zależności:**
- Wymaga implementacji US-026 (transfer własności)

---

### US-014: Leaving Tour by Participant

**Status:** Backend exists, missing UI  
**Priorytet:** Niski  
**Wpływ na zaliczenie:** ❌ Nie blokuje zaliczenia

**Opis:**
Uczestnik wycieczki powinien mieć możliwość opuszczenia wycieczki, jeśli nie może lub nie chce już uczestniczyć.

**Wymagania:**
- Przycisk "Leave tour" na stronie wycieczki (dla uczestników, nie właścicieli)
- Potwierdzenie akcji
- Usunięcie z listy uczestników
- Utrata dostępu do szczegółów wycieczki

**Szacowany czas implementacji:** 2-3 godziny

**Pliki do utworzenia/modyfikacji:**
- `src/components/tours/TourDetailsView.tsx` (dodanie przycisku "Leave tour")
- `src/components/tours/LeaveTourDialog.tsx` (NOWY - dialog potwierdzenia)
- `src/lib/hooks/useTourMutations.ts` (dodanie useLeaveTourMutation)
- `src/pages/api/tours/[tourId]/leave.ts` (NOWY - endpoint API)

**Uwagi:**
- Backend już istnieje (prawdopodobnie w `tour.service.ts`)
- Wymaga tylko dodania UI

---

### US-026: Transfer of Tour Ownership

**Status:** Depends on US-008  
**Priorytet:** Edge case  
**Wpływ na zaliczenie:** ❌ Nie blokuje zaliczenia

**Opis:**
Gdy właściciel wycieczki usuwa swoje konto, własność wycieczki powinna być automatycznie przekazana innemu uczestnikowi.

**Wymagania:**
- Automatyczny transfer własności przy usuwaniu konta właściciela
- Nowy właściciel to uczestnik, który dołączył jako pierwszy po założycielu
- Wszyscy uczestnicy pozostają bez zmian
- Jeśli właściciel był jedynym uczestnikiem, wycieczka jest usuwana

**Szacowany czas implementacji:** 3-4 godziny

**Pliki do utworzenia/modyfikacji:**
- `src/lib/services/tour.service.ts` (metoda transferTourOwnership)
- `supabase/migrations/*_owner_transfer_function.sql` (NOWY - funkcja DB)
- `src/pages/api/profiles/me.ts` (integracja z deleteAccount)

**Zależności:**
- Wymaga implementacji US-008 (usuwanie konta)

**Logika transferu:**
```sql
-- Pseudokod logiki transferu
1. Znajdź wszystkich uczestników wycieczki
2. Posortuj po joined_at (data dołączenia)
3. Wybierz pierwszego uczestnika (poza właścicielem)
4. Zaktualizuj owner_id w tabeli tours
5. Jeśli brak uczestników, usuń wycieczkę
```

---

## 📊 Priorytetyzacja

### Wysoki Priorytet (opcjonalne, ale przydatne)
- **US-008**: Usuwanie konta użytkownika
  - Często używana funkcja
  - Wymagana dla pełnej zgodności z PRD
  - Zależność dla US-026

### Średni Priorytet
- **US-014**: Opuszczanie wycieczki
  - Prosta implementacja (backend już istnieje)
  - Poprawia UX dla uczestników

### Niski Priorytet (edge case)
- **US-026**: Transfer własności
  - Edge case (rzadko używane)
  - Wymaga US-008
  - Ważne dla integralności danych

---

## 🔄 Zależności

```
US-008 (Delete Account)
  └── US-026 (Transfer Ownership)
  
US-014 (Leave Tour)
  └── (niezależne)
```

---

## 📝 Notatki Implementacyjne

### US-008: Delete Account

**Bezpieczeństwo:**
- Wymagaj dwustopniowego potwierdzenia
- Rozważ weryfikację email przed usunięciem
- Anonimizuj komentarze (mechanizm już istnieje)
- Usuń dane z wszystkich powiązanych tabel

**Przykładowy flow:**
1. Użytkownik klika "Delete Account" w profilu
2. Dialog: checkbox "I understand this action is irreversible"
3. Dialog: pole tekstowe "Type DELETE to confirm"
4. Weryfikacja i usunięcie konta
5. Transfer własności wycieczek (US-026)

### US-014: Leave Tour

**UI/UX:**
- Przycisk widoczny tylko dla uczestników (nie właścicieli)
- Umieść przycisk w sekcji uczestników
- Prosty dialog potwierdzenia: "Are you sure you want to leave this tour?"

**Backend:**
- Sprawdź czy backend endpoint już istnieje
- Jeśli nie, utwórz `DELETE /api/tours/[tourId]/participants/me`

### US-026: Transfer Ownership

**Logika:**
- Uruchamiane automatycznie przy usuwaniu konta
- Funkcja DB: `transfer_tour_ownership(tour_id, new_owner_id)`
- Trigger lub wywołanie z `deleteAccount()`

**Edge cases:**
- Jeśli brak uczestników → usuń wycieczkę
- Jeśli wycieczka jest zarchiwizowana → tylko transfer, bez usuwania
- Loguj transfer dla audytu

---

## ✅ Checklist Przed Implementacją

### US-008: Delete Account
- [ ] Utworzyć endpoint `DELETE /api/profiles/me`
- [ ] Dodać metodę `deleteAccount()` w `profile.service.ts`
- [ ] Utworzyć `DeleteAccountDialog.tsx`
- [ ] Dodać przycisk w `ProfileView.tsx`
- [ ] Zintegrować z US-026 (transfer własności)
- [ ] Dodać tłumaczenia (en-US, pl-PL)
- [ ] Przetestować anonimizację komentarzy
- [ ] Przetestować transfer własności

### US-014: Leave Tour
- [ ] Sprawdzić czy backend endpoint istnieje
- [ ] Utworzyć endpoint `DELETE /api/tours/[tourId]/participants/me` (jeśli nie istnieje)
- [ ] Utworzyć `LeaveTourDialog.tsx`
- [ ] Dodać przycisk w `TourDetailsView.tsx`
- [ ] Dodać hook `useLeaveTourMutation()`
- [ ] Dodać tłumaczenia (en-US, pl-PL)
- [ ] Przetestować scenariusz: uczestnik opuszcza wycieczkę

### US-026: Transfer Ownership
- [ ] Utworzyć funkcję DB `transfer_tour_ownership()`
- [ ] Dodać metodę w `tour.service.ts`
- [ ] Zintegrować z `deleteAccount()`
- [ ] Przetestować scenariusz: właściciel usuwa konto
- [ ] Przetestować edge case: brak uczestników
- [ ] Przetestować edge case: zarchiwizowana wycieczka

---

## 📚 Powiązane Dokumenty

- `.ai/prd.md` - Product Requirements Document (pełne wymagania)
- `.ai/implementation-roadmap.md` - Roadmap implementacji
- `.ai/verification-report.md` - Raport weryfikacji wymagań

---

**Uwaga:** Te funkcjonalności są opcjonalne i nie są wymagane dla zaliczenia projektu. MVP jest w 100% kompletny bez nich.


