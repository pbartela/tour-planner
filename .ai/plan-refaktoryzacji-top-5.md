📊 Analiza Złożoności Komponentów - TOP 5
1️⃣ InviteAcceptanceView.tsx

Ścieżka: src/components/invitations/InviteAcceptanceView.tsx:1
Linie kodu: 247 linii
🔍 Wykryte problemy złożoności:

    God Component Anti-Pattern - komponent obsługuje zbyt wiele odpowiedzialności:
        Fetching danych (useEffect)
        Zarządzanie stanem (5 różnych stanów lokalnych)
        Logika biznesowa (walidacja email, sprawdzanie expiracji)
        Rendering 4 różnych widoków (loading, error, expired, success)
        Nawigacja (window.location.href)

    Nadmierne użycie localStorage state - 5 różnych useState:

    const [invitation, setInvitation] = useState<InvitationByTokenDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    Imperatywna nawigacja - użycie window.location.href zamiast Astro View Transitions

    Powtarzalny kod renderowania - podobna struktura w 3 różnych return statements

✨ Sugerowane kierunki refaktoryzacji:

A) Pattern: Custom Hook + Reducer Pattern

// 1. Wydziel logikę do custom hooka z useReducer
const useInvitationAcceptance = (token: string) => {
  const [state, dispatch] = useReducer(invitationReducer, initialState);
  // ... logika
  return { state, actions };
};

// 2. Upraszcza komponent do czystego UI
export const InviteAcceptanceView = ({ token, currentUserId, userEmail }: Props) => {
  const { state, actions } = useInvitationAcceptance(token);
  // Tylko rendering
};

B) Pattern: Compound Components Pattern

// Rozbij na mniejsze komponenty:
<InvitationView>
  <InvitationView.Loading /> 
  <InvitationView.Error />
  <InvitationView.Expired />
  <InvitationView.Actions />
</InvitationView>

C) Pattern: Suspense + Error Boundary (React 19)

// Wykorzystaj React 19 features:
<ErrorBoundary fallback={<InvitationError />}>
  <Suspense fallback={<SkeletonLoader />}>
    <InvitationContent token={token} />
  </Suspense>
</ErrorBoundary>

D) Zmiana nawigacji na Astro-native:

import { navigate } from "astro:transitions/client";
// Zamiast window.location.href
await navigate(`/tours/${result.tour_id}`);

Korzyści:

    ✅ Separacja concerns (logika vs UI)
    ✅ Łatwiejsze testowanie
    ✅ Kod reużywalny (hook w innych komponentach)
    ✅ Mniej stanów lokalnych (reducer pattern)
    ✅ Lepsze wsparcie dla Astro View Transitions

2️⃣ TourDetailsView.tsx

Ścieżka: src/components/tours/TourDetailsView.tsx:1
Linie kodu: 242 linie
🔍 Wykryte problemy złożoności:

    Monolityczny komponent - jeden komponent renderuje 5 głównych sekcji:
        Tour Header (szczegóły wycieczki)
        Invitations Section (tylko dla ownera)
        Voting Lock Controls (tylko dla ownera)
        Voting Section
        Comments Section

    Nadmierna liczba hooks - 7 różnych hoków w jednym komponencie:

    const { data: tour, isLoading, isError, error } = useTourDetails(tourId);
    const deleteMutation = useDeleteTourMutation();
    const lockVotingMutation = useLockVotingMutation();
    const unlockVotingMutation = useUnlockVotingMutation();
    const markAsViewedMutation = useMarkTourAsViewedMutation();

    Mieszanie logiki RBAC - warunki dla isOwner rozrzucone po całym komponencie

    Deep nesting - zagnieżdżenie JSX do 5+ poziomów w kilku miejscach

✨ Sugerowane kierunki refaktoryzacji:

A) Pattern: Feature-Based Component Architecture

// Rozdziel na komponenty po odpowiedzialności:
<TourDetailsView>
  <TourHeader tour={tour} isOwner={isOwner} />
  {isOwner && <TourOwnerControls tourId={tourId} tour={tour} />}
  <TourVotingSection tourId={tourId} tour={tour} isOwner={isOwner} />
  <TourCommentsSection tourId={tourId} currentUserId={currentUserId} />
</TourDetailsView>

B) Pattern: Container/Presenter Pattern

// Container - logika
const TourDetailsContainer = ({ tourId, currentUserId }) => {
  const tour = useTourDetails(tourId);
  const mutations = useTourMutations(tourId);
  
  return <TourDetailsPresenter tour={tour} mutations={mutations} />;
};

// Presenter - czysty UI
const TourDetailsPresenter = ({ tour, mutations }) => {
  // Tylko rendering, zero logiki
};

C) Pattern: Custom Hook Composition

// Wydziel grupowanie hooks do kompozycji:
const useTourDetailsLogic = (tourId: string, currentUserId: string) => {
  const tour = useTourDetails(tourId);
  const mutations = {
    delete: useDeleteTourMutation(),
    lockVoting: useLockVotingMutation(),
    unlockVoting: useUnlockVotingMutation(),
  };
  const actions = useTourActions(tour, mutations);
  
  return { tour, mutations, actions };
};

D) Pattern: RBAC Higher-Order Component

// Encapsuluj logikę RBAC:
const withOwnerPermissions = (Component) => (props) => {
  const isOwner = props.tour?.owner_id === props.currentUserId;
  return <Component {...props} isOwner={isOwner} />;
};

export default withOwnerPermissions(TourDetailsView);

Korzyści:

    ✅ Single Responsibility Principle
    ✅ Łatwiejsze testowanie pojedynczych sekcji
    ✅ Lepsza czytelność i maintainability
    ✅ Możliwość lazy loading poszczególnych sekcji
    ✅ Centralizacja logiki RBAC

3️⃣ PendingInvitationsIndicator.tsx

Ścieżka: src/components/invitations/PendingInvitationsIndicator.tsx:1
Linie kodu: 218 linii
🔍 Wykryte problemy złożoności:

    Brak separacji componentów - InvitationItem zdefiniowany wewnątrz tego samego pliku (powinien być w osobnym pliku)

    Duplikacja logiki formatowania - funkcje getDaysUntilExpiration i formatExpirationMessage to utility functions w złym miejscu

    Tight coupling z danymi - komponent jest mocno powiązany z formatem danych z API

    Brak memoizacji - InvitationItem re-renderuje się przy każdym kliknięciu nawet jak dane się nie zmieniły

    Mieszanie stanów - isAccepting i isDeclining mogą być zastąpione przez jeden stan

✨ Sugerowane kierunki refaktoryzacji:

A) Pattern: Extract Utility Module

// src/lib/utils/date-formatters.ts
export const getDaysUntilExpiration = (expiresAt: string): number => {
  // ... logika
};

export const formatExpirationMessage = (
  expiresAt: string,
  t: TFunction
): string => {
  // ... logika
};

B) Pattern: Component Extraction + Memoization

// src/components/invitations/InvitationItem.tsx
export const InvitationItem = React.memo(({ invitation, onAccept, onDecline, isProcessing }: InvitationItemProps) => {
  // Wydziel do osobnego pliku + memoizuj
}, (prev, next) => {
  return prev.invitation.id === next.invitation.id && 
         prev.isProcessing === next.isProcessing;
});

C) Pattern: State Machine (XState lub useReducer)

// Zamiast dwóch stanów (isAccepting, isDeclining):
type InvitationActionState = 
  | { status: 'idle' }
  | { status: 'accepting' }
  | { status: 'declining' };

const [actionState, setActionState] = useState<InvitationActionState>({ status: 'idle' });

D) Pattern: Adapter Pattern dla danych API

// src/lib/adapters/invitation.adapter.ts
export const adaptInvitationDto = (dto: InvitationDto): InvitationViewModel => ({
  ...dto,
  daysUntilExpiration: getDaysUntilExpiration(dto.expires_at),
  isExpiringSoon: getDaysUntilExpiration(dto.expires_at) <= 2,
});

E) Pattern: Render Props / Headless UI

// Separuj logikę od UI:
<InvitationDropdown>
  {({ invitations, handleAccept, handleDecline, isProcessing }) => (
    <YourCustomUI />
  )}
</InvitationDropdown>

Korzyści:

    ✅ Reużywalne utility functions
    ✅ Lepsze performance (memoizacja)
    ✅ Łatwiejsze testowanie (osobne pliki)
    ✅ Możliwość użycia różnych UI dla tej samej logiki (headless pattern)
    ✅ Loose coupling z API

4️⃣ InvitedUsersList.tsx

Ścieżka: src/components/tours/InvitedUsersList.tsx:1
Linie kodu: 192 linie
🔍 Wykryte problemy złożoności:

    Złożona logika warunkowa - wielokrotne sprawdzenia dla canCancel, canRemove, canResend:

    const canCancel = isOwner && status === "pending" && !isExpired;
    const canRemove = isOwner && (status === "declined" || (status === "pending" && isExpired));
    const canResend = isOwner && (status === "declined" || (status === "pending" && isExpired));

    Duża złożoność cyklomatyczna - wiele zagnieżdżonych warunków w renderowaniu

    Brak reużywalności - logika permissions jest hardcoded

    Powielona logika - canRemove i canResend mają identyczny warunek

    Mixed concerns - komponent obsługuje i wyświetlanie i zarządzanie stanem dialogu

✨ Sugerowane kierunki refaktoryzacji:

A) Pattern: Business Logic Layer - Permissions Service

// src/lib/services/invitation-permissions.service.ts
export class InvitationPermissions {
  static canCancel(invitation: Invitation, isOwner: boolean): boolean {
    return isOwner && invitation.status === "pending" && !invitation.isExpired;
  }
  
  static canResend(invitation: Invitation, isOwner: boolean): boolean {
    return isOwner && (invitation.status === "declined" || invitation.isExpired);
  }
  
  static getAvailableActions(invitation: Invitation, isOwner: boolean): Action[] {
    // Zwraca listę dostępnych akcji
  }
}

B) Pattern: Strategy Pattern dla akcji

// src/lib/strategies/invitation-actions.ts
const invitationActions = {
  cancel: {
    canExecute: (inv, isOwner) => isOwner && inv.status === "pending" && !inv.isExpired,
    label: (t) => t("invitations.cancelButton"),
    execute: (inv, mutation) => mutation.mutateAsync(inv.id),
  },
  resend: {
    canExecute: (inv, isOwner) => isOwner && (inv.status === "declined" || inv.isExpired),
    label: (t) => t("invitations.resendButton"),
    execute: (inv, mutation) => mutation.mutateAsync(inv.id),
  },
};

C) Pattern: Extract Sub-Components

// Wydziel InvitationListItem do osobnego komponentu:
<InvitationListItem 
  invitation={invitation}
  actions={getAvailableActions(invitation, isOwner)}
  onActionExecute={handleAction}
/>

D) Pattern: Custom Hook dla Dialog State

// src/lib/hooks/useDialogState.ts
const useCancelDialog = () => {
  const [dialogState, setDialogState] = useState({
    open: false,
    invitationId: "",
    email: "",
  });
  
  const openDialog = (invitationId: string, email: string) => {
    setDialogState({ open: true, invitationId, email });
  };
  
  const closeDialog = () => {
    setDialogState({ open: false, invitationId: "", email: "" });
  };
  
  return { dialogState, openDialog, closeDialog };
};

E) Pattern: Higher-Order Component dla RBAC

// Wrapper który automatycznie filtruje dostępne akcje:
const withInvitationPermissions = (Component) => (props) => {
  const permissions = useInvitationPermissions(props.isOwner);
  return <Component {...props} permissions={permissions} />;
};

Korzyści:

    ✅ Testowalna logika biznesowa (permissions service)
    ✅ DRY - zero duplikacji warunków
    ✅ Łatwe dodawanie nowych akcji (strategy pattern)
    ✅ Separacja UI od logiki
    ✅ Reużywalny dialog state management

5️⃣ DatePicker.tsx

Ścieżka: src/components/ui/DatePicker.tsx:1
Linie kodu: 192 linie
🔍 Wykryte problemy złożoności:

    Tight coupling z locale - logika formatowania dat mocno powiązana z locale w komponencie UI

    Brak separacji concerns - komponent UI zawiera logikę formatowania dat

    Duplikacja kodu - podobna logika w formatDateByLocale i getDateFormatHint

    Mixed responsibilities - komponent zarządza i UI (Popover, Button) i logiką (formatowanie, walidacja dat)

    Brak use of class-variance-authority dla wariantów - CVA jest używane, ale mogłoby być lepiej wykorzystane

✨ Sugerowane kierunki refaktoryzacji:

A) Pattern: Extract Date Formatting Service

// src/lib/services/date-formatter.service.ts
export class DateFormatterService {
  private locale: string;
  
  constructor(locale: string) {
    this.locale = locale;
  }
  
  format(date: Date | undefined): string {
    if (!date) return "";
    return new Intl.DateTimeFormat(this.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }
  
  getFormatHint(): string {
    // Logika getDateFormatHint
  }
}

B) Pattern: Headless UI Component Pattern

// Rozdziel na headless logic + UI:

// 1. Headless logic hook
const useDatePickerLogic = ({ value, onChange, locale, minDate, maxDate }) => {
  const [open, setOpen] = useState(false);
  const formatter = useMemo(() => new DateFormatterService(locale), [locale]);
  
  return {
    open,
    setOpen,
    formatter,
    isDateDisabled: (date) => { /* logika */ },
    handleDateSelect: (date) => { /* logika */ },
  };
};

// 2. UI component
const DatePicker = (props) => {
  const logic = useDatePickerLogic(props);
  return <DatePickerUI {...logic} {...props} />;
};

C) Pattern: Composition over CVA Props

// Zamiast przekazywać variant i size przez props, użyj composition:
<DatePicker.Root>
  <DatePicker.Trigger variant="primary" size="lg" />
  <DatePicker.Calendar />
  <DatePicker.HiddenInput />
</DatePicker.Root>

D) Pattern: Context API dla locale

// Zamiast prop drilling locale:
const LocaleContext = createContext<string>('en-US');

export const DatePicker = (props) => {
  const locale = useContext(LocaleContext) ?? props.locale ?? 'en-US';
  // ...
};

E) Pattern: Date Adapter Pattern (Inspire by date-fns/dayjs)

// src/lib/adapters/date.adapter.ts
export interface DateAdapter {
  format(date: Date, formatString: string): string;
  isAfter(date: Date, dateToCompare: Date): boolean;
  isBefore(date: Date, dateToCompare: Date): boolean;
}

// Implementacja dla różnych bibliotek lub native
class NativeDateAdapter implements DateAdapter {
  // Implementacja
}

F) Pattern: React 19 - use() Hook dla async formatting

// Jeśli formatowanie jest async (np. ładowanie locale data):
const DatePicker = ({ locale, ...props }) => {
  const formatter = use(loadDateFormatter(locale));
  // ...
};

Korzyści:

    ✅ Testowalna logika formatowania (service)
    ✅ Reużywalna logika (headless pattern)
    ✅ Łatwa zmiana biblioteki do dat (adapter pattern)
    ✅ Mniej prop drilling (context dla locale)
    ✅ Zgodność z i18n best practices
    ✅ Możliwość użycia różnych UI dla tej samej logiki

📈 Podsumowanie i Rekomendacje
Wspólne wzorce do zastosowania:

    Custom Hooks Pattern - wydzielenie logiki ze wszystkich 5 komponentów do dedykowanych hooks
    Service Layer Pattern - separacja logiki biznesowej (permissions, formatowanie, API calls)
    Compound Components / Headless UI - separacja logiki od prezentacji
    Strategy Pattern - dla złożonych warunków i akcji
    React.memo + useCallback - optymalizacja performance w list rendering
    Container/Presenter Pattern - separacja data fetching od UI

Metryki do śledzenia po refaktoryzacji:

    LOC per component: ≤ 150 linii
    Cyclomatic Complexity: ≤ 10
    Hooks per component: ≤ 5
    Nesting depth: ≤ 3 poziomy
    Test coverage: ≥ 80%

Kolejność refaktoryzacji (według priorytetu):

    TourDetailsView - największy impact na maintainability
    InviteAcceptanceView - dużo duplikacji do wyeliminowania
    InvitedUsersList - złożona logika permissions do wydzielenia
    PendingInvitationsIndicator - utility functions do extracted
    DatePicker - najmniej pilne, ale warto dla consistency
