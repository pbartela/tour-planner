# Problem z formatem daty w date pickerze

## Obecny stan

W komponencie `AddTripModal.tsx` używamy HTML5 `<input type="date">` do wyboru dat.

### Problem

- Użytkownik ma ustawienia systemowe na `en-US`
- Data wyświetla się jako **10/28/2025** (mm/dd/yyyy)
- Dla języka polskiego oczekiwany format to **28/10/2025** (dd/mm/yyyy)

### Lokalizacja kodu

**Plik**: `src/components/tours/AddTripModal.tsx`

- Linie 176-185: Input dla daty rozpoczęcia (start date)
- Linie 193-202: Input dla daty zakończenia (end date)

### Co zostało już zrobione

1. ✅ Dodano atrybut `lang={i18n.language}` do input (linie 184, 201)
2. ✅ Dodano tekstowe hinty z formatem daty (linie 186, 203)
3. ✅ Dodano domyślne wartości dat (dzisiaj i jutro)
4. ✅ i18n działa poprawnie dla wszystkich innych tekstów

### Dlaczego to nie działa

**Ograniczenie HTML5 `<input type="date">`:**

- Przeglądarki (Chrome, Firefox, Safari, Edge) **ignorują** atrybut `lang` dla date input
- Date picker zawsze używa **ustawień systemowych użytkownika**, nie języka strony
- To jest zgodne ze specyfikacją HTML5 i standardowym zachowaniem
- Dane są przechowywane w ISO format (YYYY-MM-DD) niezależnie od wyświetlanego formatu

**Dokumentacja:**

- [MDN: `<input type="date">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
- [WHATWG HTML Spec](<https://html.spec.whatwg.org/multipage/input.html#date-state-(type=date)>)

## Rozwiązania

### Rozwiązanie 1: Zaakceptować standardowe zachowanie (ZALECANE)

**Zalety:**

- Użytkownicy widzą format zgodny z ich systemowymi preferencjami
- Brak dodatkowych zależności
- Prosty kod
- Standardowe zachowanie większości stron

**Wady:**

- Format nie zmienia się z językiem strony
- Użytkownik musi mieć poprawne ustawienia systemowe

### Rozwiązanie 2: Custom Date Picker Library

#### Opcja A: `react-datepicker`

```bash
npm install react-datepicker
npm install --save-dev @types/react-datepicker
```

**Zalety:**

- Pełna kontrola nad formatem wyświetlania
- Popularny (3M+ pobrań tygodniowo)
- Dobra dokumentacja
- Wsparcie dla i18n

**Wady:**

- Dodatkowa zależność (~50KB)
- Wymaga custom stylowania dla DaisyUI
- Bardziej skomplikowany kod

#### Opcja B: `react-day-picker`

```bash
npm install react-day-picker date-fns
```

**Zalety:**

- Nowoczesny, dostępny (a11y)
- Wsparcie dla date-fns (używane przez Astro)
- Lekki (~20KB)
- Łatwe do stylowania

**Wady:**

- Dodatkowe zależności
- Wymaga więcej konfiguracji

#### Opcja C: `@mui/x-date-pickers`

```bash
npm install @mui/x-date-pickers @mui/material @emotion/react @emotion/styled
```

**Zalety:**

- Profesjonalny wygląd
- Bogate funkcje
- Świetna integracja z Material Design

**Wady:**

- Bardzo ciężki (~500KB+)
- Wymaga MUI theme
- Konflikty stylu z DaisyUI

## Rekomendacja

### Dla małych projektów / prototypów:

**Zaakceptuj standardowe zachowanie HTML5**

- Użytkownicy są przyzwyczajeni do swojego systemowego formatu
- Większość użytkowników ma system w ich ojczystym języku
- Dane są poprawnie zapisywane niezależnie od formatu wyświetlania

### Dla produkcyjnych aplikacji:

**Użyj `react-day-picker`**

- Lekki i nowoczesny
- Pełna kontrola nad formatem
- Dobry kompromis między funkcjonalnością a rozmiarem

## Przykład implementacji z react-day-picker

```tsx
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import "react-day-picker/dist/style.css";

const { i18n } = useTranslation("tours");
const locale = i18n.language === "pl-PL" ? pl : enUS;
const dateFormat = i18n.language === "pl-PL" ? "dd/MM/yyyy" : "MM/dd/yyyy";

const [startDate, setStartDate] = useState<Date>(new Date());

<DayPicker
  mode="single"
  selected={startDate}
  onSelect={setStartDate}
  locale={locale}
  formatters={{
    formatCaption: (date) => format(date, "LLLL yyyy", { locale }),
  }}
/>;
```

## Następne kroki

1. Zdecydować którą opcję wybrać
2. Jeśli custom picker:
   - Wybrać bibliotekę
   - Zainstalować zależności
   - Stworzyć wrapper component `DateInput.tsx`
   - Zastąpić HTML5 input w `AddTripModal.tsx`
   - Dopasować style do DaisyUI theme

## Status aktualny

- ❌ Format daty nie odpowiada językowi strony
- ✅ Dane są poprawnie zapisywane w ISO format
- ✅ Wszystkie inne translacje działają
- ✅ Middleware i18n działa poprawnie
- ⏸️ Oczekiwanie na decyzję: standard HTML5 vs custom picker
