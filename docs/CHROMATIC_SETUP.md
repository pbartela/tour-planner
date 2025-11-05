# Chromatic Setup Guide

Chromatic to platforma do testowania wizualnej regresji dla Storybook. Ten przewodnik opisuje jak skonfigurować Chromatic dla projektu Plan Tour.

## Czym jest Chromatic?

Chromatic automatycznie:
- Buduje Storybook przy każdym commit
- Robi snapshoty wszystkich stories
- Porównuje z poprzednimi wersjami
- Wykrywa zmiany wizualne
- Pozwala zaakceptować lub odrzucić zmiany

## Krok 1: Założenie Konta

1. Przejdź na [chromatic.com](https://www.chromatic.com/)
2. Zaloguj się przez GitHub
3. Kliknij "Add project"
4. Wybierz repozytorium `tour-planner`

## Krok 2: Otrzymanie Project Token

Po dodaniu projektu:

1. Skopiuj wyświetlony **Project Token**
2. Zapisz go bezpiecznie - będzie potrzebny w następnych krokach

## Krok 3: Konfiguracja Lokalna

Utwórz plik konfiguracyjny dla lokalnego użycia:

```bash
cp .chromatic.config.example.json .chromatic.config.json
```

Otwórz `.chromatic.config.json` i wklej swój token:

```json
{
  "projectToken": "chpt_your_actual_token_here",
  "buildScriptName": "build-storybook",
  "storybookBuildDir": "storybook-static",
  "onlyChanged": true,
  "exitZeroOnChanges": true,
  "exitOnceUploaded": true,
  "autoAcceptChanges": "main"
}
```

**⚠️ Uwaga:** Plik `.chromatic.config.json` jest w `.gitignore` i nie powinien być commitowany!

## Krok 4: Konfiguracja GitHub Actions

Dodaj token jako GitHub Secret:

1. Przejdź do Settings repozytorium na GitHub
2. Kliknij **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**
4. Name: `CHROMATIC_PROJECT_TOKEN`
5. Secret: Wklej swój Project Token
6. Kliknij **Add secret**

## Krok 5: Pierwsze Uruchomienie

Uruchom Chromatic lokalnie:

```bash
npm run test:chromatic
```

To:
1. Zbuduje Storybook (`npm run build-storybook`)
2. Przesle build do Chromatic
3. Utworzy baseline snapshots
4. Wyświetli link do rezultatów

## Krok 6: Review w Chromatic UI

1. Kliknij link z outputu (lub przejdź do chromatic.com)
2. Zobacz wszystkie stories jako snapshoty
3. Przy pierwszym uruchomieniu wszystko będzie "New" - zaakceptuj je jako baseline

## Workflow CI/CD

Po skonfigurowaniu, Chromatic automatycznie uruchamia się:

### Pull Request
1. Otwierasz PR
2. GitHub Actions uruchamia workflow `test.yml`
3. Job `chromatic` buduje i uploaduje snapshoty
4. Chromatic porównuje z baseline
5. Jeśli są różnice - pokazuje je w PR jako check

### Main Branch
1. Po merge do `main`
2. Chromatic aktualizuje baseline automatycznie (dzięki `autoAcceptChanges: "main"`)

## Użycie

### Lokalne Testowanie

```bash
# Uruchom Chromatic
npm run test:chromatic

# Chromatic automatycznie:
# - Wykryje zmiany w stories
# - Porówna tylko zmienione komponenty (onlyChanged: true)
# - Exit z kodem 0 nawet jeśli są zmiany (exitZeroOnChanges: true)
```

### Akceptowanie Zmian

**W UI Chromatic:**
1. Przejdź do buildu na chromatic.com
2. Zobacz różnice (diff view)
3. Kliknij ✓ Approve lub ✗ Deny dla każdej zmiany

**Automatycznie:**
- Zmiany na branchu `main` są auto-akceptowane

### Odrzucanie Zmian

Jeśli Chromatic pokazuje niezamierzone zmiany:
1. Odrzuć je w UI
2. Napraw kod
3. Push nowy commit
4. Chromatic uruchomi się ponownie

## Opcje Konfiguracji

### `.chromatic.config.json`

| Opcja | Opis |
|-------|------|
| `projectToken` | Token projektu Chromatic |
| `buildScriptName` | Skrypt do budowania Storybook |
| `storybookBuildDir` | Katalog z zbudowanym Storybook |
| `onlyChanged` | Testuj tylko zmienione komponenty |
| `exitZeroOnChanges` | Exit 0 nawet jeśli są zmiany (dla CI) |
| `exitOnceUploaded` | Exit od razu po upload (szybsze) |
| `autoAcceptChanges` | Auto-akceptuj zmiany na określonym branchu |

### Zaawansowane Opcje

```json
{
  "projectToken": "...",
  "skip": "true", // Pomiń test (użyteczne w branch names)
  "ignoreLastBuildOnBranch": "main", // Ignoruj ostatni build z brancha
  "externals": ["public/**"], // Dodatkowe pliki do trackowania
  "fileHashing": true, // Hashuj pliki dla lepszego cachowania
  "zip": true // Kompresuj przed uploadem
}
```

## Integracja z Pull Requests

Chromatic dodaje status check do PR:

- ✓ **Passed** - Brak zmian wizualnych
- ⚠️ **Changes detected** - Znaleziono zmiany, wymaga review
- ✗ **Failed** - Błąd w buildzie

Kliknij "Details" przy checku aby zobaczyć zmiany.

## Limity Free Tier

Plan darmowy Chromatic oferuje:
- **5,000 snapshots/miesiąc**
- Nieograniczoną liczbę użytkowników
- Wszystkie podstawowe funkcje

Monitoruj użycie w Settings → Billing na chromatic.com

## Optymalizacja Snapshots

### Redukuj Liczbę Stories

Zamiast 10 podobnych stories:
```typescript
export const PrimarySmall: Story = { ... };
export const PrimaryMedium: Story = { ... };
export const PrimaryLarge: Story = { ... };
// ... x10 kombinacji
```

Użyj jednej story z wszystkimi wariantami:
```typescript
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

### Skip Stories Nie-Wizualnych

```typescript
export const Interactive: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};
```

### Delay dla Animacji

```typescript
export const WithAnimation: Story = {
  parameters: {
    chromatic: { delay: 300 }, // Czekaj 300ms przed snapshot
  },
};
```

## Troubleshooting

### Problem: "Project token is invalid"

**Rozwiązanie:**
- Sprawdź czy token jest poprawnie skopiowany
- Sprawdź czy nie ma spacji na początku/końcu
- Zweryfikuj token na chromatic.com

### Problem: Build timeouts

**Rozwiązanie:**
```bash
# Zbuduj Storybook lokalnie najpierw
npm run build-storybook

# Sprawdź czy nie ma błędów
```

### Problem: Too many snapshots

**Rozwiązanie:**
- Włącz `onlyChanged: true` w konfiguracji
- Zredukuj liczbę stories (patrz Optymalizacja)
- Użyj `disableSnapshot` dla stories które nie wymagają testowania

### Problem: Zmiany nie są wykrywane

**Rozwiązanie:**
- Upewnij się że Storybook jest aktualny: `npm run storybook`
- Clear cache: `rm -rf node_modules/.cache`
- Przebuduj: `npm run build-storybook`

## Resources

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook Testing](https://storybook.js.org/docs/react/writing-tests/introduction)
- [Visual Testing Best Practices](https://www.chromatic.com/docs/test)

## Wsparcie

Problemy z Chromatic?
- Dokumentacja: https://www.chromatic.com/docs/
- Discord: https://discord.gg/storybook
- Email: support@chromatic.com
