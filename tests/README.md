# Tests Directory

Ten katalog zawiera testy End-to-End (E2E) dla aplikacji Plan Tour.

## Struktura

```
tests/
├── e2e/                    # Testy E2E
│   ├── auth/              # Testy uwierzytelniania
│   │   └── auth-protection.spec.ts
│   ├── i18n/              # Testy internacjonalizacji
│   │   └── language-switching.spec.ts
│   ├── ui/                # Testy UI i responsywności
│   │   └── responsive-design.spec.ts
│   └── smoke.spec.ts      # Smoke tests
├── helpers/               # Funkcje pomocnicze
│   └── auth.ts           # Helpery uwierzytelniania
└── README.md             # Ten plik
```

## Szybki Start

```bash
# Zainstaluj zależności (tylko raz)
npm install
npx playwright install

# Uruchom wszystkie testy
npm run test

# Uruchom testy w UI mode
npm run test:ui

# Uruchom konkretny plik testów
npx playwright test tests/e2e/smoke.spec.ts
```

## Konwencje Nazewnictwa

- **Pliki testów**: `*.spec.ts`
- **Helpery**: `*.ts` (bez .spec)
- **Organizacja**: Grupuj testy według funkcjonalności

## Mapowanie do Planu Testów

Testy są mapowane do scenariuszy z `.ai/@test-plan.mdc`:

| ID Scenariusza | Plik Testu |
|---------------|------------|
| AUTH-02 | `auth/auth-protection.spec.ts` |
| I18N-01 | `i18n/language-switching.spec.ts` |
| UI-01 | `ui/responsive-design.spec.ts` |
| Smoke Tests | `smoke.spec.ts` |

## Do Zaimplementowania

Następujące scenariusze z planu testów czekają na implementację:

- [ ] **AUTH-01**: Proces logowania przez magic link
- [ ] **TOUR-01**: Tworzenie wycieczki
- [ ] **TOUR-02**: Zapraszanie uczestników
- [ ] **TOUR-03**: System głosowania
- [ ] **SEC-01**: Testy bezpieczeństwa RLS

Każdy z tych testów wymaga:
- Konfiguracji testowej bazy Supabase
- Helperów do zarządzania danymi testowymi
- Mockowania lub integracji z serwisami email

## Więcej Informacji

Zobacz [TESTING.md](../TESTING.md) w głównym katalogu projektu dla pełnej dokumentacji.
