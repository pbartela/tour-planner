# Dokument wymagań produktu (PRD) - Plan Tour

## 1. Przegląd produktu

Aplikacja "Plan Tour" to narzędzie webowe przeznaczone do upraszczania procesu planowania grupowych wyjazdów i wycieczek. Umożliwia użytkownikom tworzenie propozycji wyjazdów, zapraszanie znajomych, wspólną dyskusję i podejmowanie decyzji dotyczących celu i planu podróży. Aplikacja centralizuje komunikację i organizację, eliminując chaos związany z używaniem wielu kanałów komunikacji, takich jak czaty, e-maile czy media społecznościowe. Głównym celem jest dostarczenie jednego, dedykowanego miejsca do sprawnej i przyjemnej organizacji wspólnych wyjazdów.

## 2. Problem użytkownika

Organizacja wyjazdów w grupie znajomych jest często chaotyczna, nieefektywna i prowadzi do frustracji. Kluczowe problemy, które rozwiązuje aplikacja, to:
*   Rozproszona komunikacja: Ustalenia dotyczące celu, terminu i planu podróży giną w gąszczu wiadomości na różnych komunikatorach.
*   Brak centralnego źródła informacji: Ważne szczegóły, takie jak adresy, daty czy linki, są trudne do odnalezienia.
*   Trudności w podejmowaniu decyzji: Zebranie ostatecznych deklaracji uczestnictwa i wspólne zatwierdzenie planu jest skomplikowane i czasochłonne.
*   Nieporozumienia i konflikty: Brak przejrzystości w planowaniu może prowadzić do niepotrzebnych napięć w grupie.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie Wycieczkami
*   Użytkownicy mogą tworzyć wycieczki, podając tytuł, cel, datę rozpoczęcia/zakończenia i opis.
*   Właściciel wycieczki może edytować wszystkie jej dane aż do daty jej zakończenia.
*   Właściciel może usunąć wycieczkę po dwuetapowym potwierdzeniu (wymagającym wpisania nazwy wycieczki).
*   Wycieczki po dacie końcowej są automatycznie archiwizowane i przechodzą w tryb "tylko do odczytu".
*   Użytkownicy mogą dodawać tagi do zarchiwizowanych wycieczek, aby ułatwić ich późniejsze wyszukiwanie.

### 3.2. System Kont Użytkowników
*   Rejestracja i logowanie odbywa się bezhasłowo, za pomocą "magicznych linków" wysyłanych na adres e-mail użytkownika. Linki są ważne przez 15-20 minut.
*   Każdy użytkownik posiada profil, w którym może edytować swoją nazwę wyświetlaną (unikalna nazwa użytkownika lub opcjonalne imię/nazwisko) oraz preferencje, takie jak język aplikacji i motyw graficzny.
*   W profilu użytkownika znajdują się listy jego aktywnych oraz zarchiwizowanych wycieczek.

### 3.3. System Społecznościowy i Głosowanie
*   Właściciel wycieczki może zapraszać uczestników, podając ich adresy e-mail.
*   Uczestnicy mogą wyrazić chęć udziału w wycieczce poprzez system głosowania "lajk".
*   Właściciel może zdefiniować opcjonalny próg "lajków", którego osiągnięcie oznacza akceptację wycieczki.
*   Właściciel posiada narzędzie do ręcznego blokowania i odblokowywania możliwości głosowania.
*   Pod każdą wycieczką znajduje się chronologiczna sekcja komentarzy. Użytkownicy mogą edytować i usuwać tylko własne komentarze.

### 3.4. Zarządzanie Uczestnikami i Uprawnieniami
*   Właściciel wycieczki ma pełne uprawnienia: edycja i usuwanie wycieczki, zapraszanie i usuwanie uczestników, zarządzanie głosowaniem oraz ustalanie opcjonalnego limitu uczestników.
*   Uczestnik może komentować, głosować i w dowolnym momencie opuścić wycieczkę.
*   Jeśli właściciel wycieczki usunie swoje konto, własność wycieczki jest automatycznie przenoszona na kolejną osobę, która dołączyła do wycieczki.

### 3.5. Interfejs i Doświadczenie Użytkownika (UI/UX)
*   Aplikacja jest w pełni responsywna i dostosowana do urządzeń mobilnych oraz desktopowych (RWD).
*   Aplikacja wspiera motywy graficzne (light/dark mode), z możliwością zmiany w ustawieniach profilu.
*   Aplikacja posiada mechanizm internacjonalizacji (i18n). Użytkownik wybiera język przy rejestracji i może go później zmienić w profilu.
*   Na liście wycieczek pojawia się dyskretny wskaźnik informujący o nowej aktywności (np. nowy komentarz). Wskaźnik znika po wejściu na stronę wycieczki.
*   Nowi użytkownicy przechodzą przez prosty, 3-etapowy onboarding. Aplikacja poprawnie obsługuje puste stany (np. brak wycieczek).
*   Kluczowe akcje użytkownika (np. wysłanie zaproszenia, usunięcie komentarza) są potwierdzane przez tymczasowe komunikaty (toast notifications).

## 4. Granice produktu

Następujące funkcjonalności celowo nie wchodzą w zakres wersji MVP (Minimum Viable Product), aby skupić się na kluczowych wartościach produktu:
*   Dodawanie pośrednich punktów na trasie wycieczki.
*   System głosowania (lajki/dislajki) dla poszczególnych komentarzy lub punktów na trasie.
*   Globalna lista znajomych na koncie użytkownika.
*   Generowanie unikalnych linków publicznych do zapraszania znajomych do wycieczki.
*   Zaawansowany system powiadomień (e-mail, push) o każdej aktywności.
*   Możliwość moderowania komentarzy innych użytkowników przez właściciela wycieczki.
*   Tradycyjne logowanie za pomocą loginu i hasła lub przez dostawców zewnętrznych (np. Google, Facebook).

## 5. Historyjki użytkowników

### Uwierzytelnianie i Onboarding

*   ID: US-001
*   Tytuł: Rejestracja nowego użytkownika przez magiczny link
*   Opis: Jako nowy użytkownik, chcę móc zarejestrować konto w aplikacji, podając swój adres e-mail i unikalną nazwę użytkownika, abym mógł zacząć planować wycieczki.
*   Kryteria akceptacji:
    *   Po podaniu adresu e-mail na stronie rejestracji, otrzymuję wiadomość z magicznym linkiem.
    *   Po kliknięciu w link, jestem przenoszony na stronę dokończenia rejestracji, gdzie muszę podać unikalną nazwę użytkownika (3-20 znaków alfanumerycznych i podkreślenia).
    *   System sprawdza unikalność nazwy użytkownika w czasie rzeczywistym.
    *   Po pomyślnej rejestracji jestem zalogowany i widzę ekran powitalny (onboarding).

*   ID: US-002
*   Tytuł: Logowanie do systemu
*   Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji, podając swój adres e-mail, abym mógł uzyskać dostęp do swoich wycieczek.
*   Kryteria akceptacji:
    *   Po podaniu zarejestrowanego adresu e-mail na stronie logowania, otrzymuję wiadomość z magicznym linkiem.
    *   Link jest ważny przez 15-20 minut.
    *   Po kliknięciu w ważny link, jestem automatycznie zalogowany i przekierowany na listę moich wycieczek.
    *   Próba użycia nieważnego lub wygasłego linku skutkuje wyświetleniem komunikatu o błędzie i prośbą o ponowne wygenerowanie linku.

*   ID: US-003
*   Tytuł: Onboarding nowego użytkownika
*   Opis: Jako nowy użytkownik, po pierwszej rejestracji chcę zobaczyć krótki przewodnik po aplikacji, aby szybko zrozumieć jej podstawowe funkcje.
*   Kryteria akceptacji:
    *   Bezpośrednio po rejestracji wyświetla się ekran powitalny z 3 prostymi krokami informacyjnymi.
    *   Na ekranie powitalnym znajduje się wyraźny przycisk (Call to Action) zachęcający do stworzenia pierwszej wycieczki.
    *   Użytkownik może pominąć onboarding.

### Zarządzanie Kontem Użytkownika

*   ID: US-004
*   Tytuł: Przeglądanie profilu użytkownika
*   Opis: Jako zalogowany użytkownik, chcę mieć dostęp do strony swojego profilu, aby zobaczyć swoje dane i listy wycieczek.
*   Kryteria akceptacji:
    *   W interfejsie aplikacji znajduje się link do mojego profilu.
    *   Na stronie profilu widzę swoją nazwę wyświetlaną i adres e-mail.
    *   Strona profilu zawiera dwie oddzielne listy: wycieczek aktywnych i zarchiwizowanych, w których biorę udział.

*   ID: US-005
*   Tytuł: Edycja profilu użytkownika
*   Opis: Jako zalogowany użytkownik, chcę móc edytować dane na moim profilu, aby móc je zaktualizować.
*   Kryteria akceptacji:
    *   Na stronie profilu znajduje się opcja edycji.
    *   Mogę zmienić swoją nazwę wyświetlaną (wybór między unikalną nazwą użytkownika a opcjonalnym imieniem i nazwiskiem).
    *   Nie mogę zmienić swojego adresu e-mail.
    *   Zmiany są zapisywane po kliknięciu przycisku "Zapisz".

*   ID: US-006
*   Tytuł: Zmiana języka aplikacji
*   Opis: Jako użytkownik, chcę móc zmienić język interfejsu aplikacji w ustawieniach profilu, aby korzystać z niej w preferowanym języku.
*   Kryteria akceptacji:
    *   W ustawieniach profilu znajduje się lista rozwijana z dostępnymi językami.
    *   Po wybraniu nowego języka i zapisaniu zmian, cały interfejs aplikacji jest wyświetlany w tym języku.
    *   Wybór języka jest zapamiętywany dla mojego konta.

*   ID: US-007
*   Tytuł: Zmiana motywu aplikacji (dark/light mode)
*   Opis: Jako użytkownik, chcę móc przełączać się między jasnym i ciemnym motywem aplikacji, aby dostosować jej wygląd do moich preferencji.
*   Kryteria akceptacji:
    *   W ustawieniach profilu znajduje się przełącznik motywu (jasny/ciemny).
    *   Zmiana motywu jest natychmiastowa i dotyczy całej aplikacji.
    *   Wybór motywu jest zapamiętywany dla mojego konta na danym urządzeniu/przeglądarce.

*   ID: US-008
*   Tytuł: Usunięcie konta użytkownika
*   Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich moich danych.
*   Kryteria akceptacji:
    *   W ustawieniach profilu znajduje się opcja usunięcia konta.
    *   Akcja wymaga dwuetapowego potwierdzenia (np. checkbox + przycisk "Usuń", a następnie wpisanie hasła lub frazy).
    *   Po usunięciu konta wszystkie moje dane osobowe są usuwane z systemu.
    *   Jeśli jestem właścicielem jakichś wycieczek, własność jest przenoszona na innego uczestnika.

### Zarządzanie Wycieczkami

*   ID: US-009
*   Tytuł: Tworzenie nowej wycieczki
*   Opis: Jako zalogowany użytkownik, chcę móc stworzyć nową wycieczkę, podając jej kluczowe informacje, abym mógł zaprosić do niej znajomych.
*   Kryteria akceptacji:
    *   Na stronie listy wycieczek znajduje się przycisk "Stwórz nową wycieczkę".
    *   Formularz tworzenia wycieczki wymaga podania tytułu, celu, daty rozpoczęcia i zakończenia oraz opisu.
    *   Mogę opcjonalnie ustawić limit uczestników i próg "lajków" wymagany do akceptacji.
    *   Po pomyślnym utworzeniu wycieczki, staję się jej właścicielem i jestem przekierowany na jej stronę.

*   ID: US-010
*   Tytuł: Wyświetlanie listy wycieczek
*   Opis: Jako zalogowany użytkownik, chcę widzieć listę wszystkich wycieczek, w których biorę udział, aby mieć szybki przegląd nadchodzących i przeszłych planów.
*   Kryteria akceptacji:
    *   Domyślnym widokiem po zalogowaniu jest lista aktywnych wycieczek.
    *   Na liście widzę podstawowe informacje o każdej wycieczce: tytuł, datę.
    *   Przy wycieczkach z nową, nieprzeczytaną aktywnością widoczny jest specjalny wskaźnik.
    *   Jeśli nie biorę udziału w żadnej wycieczce, widzę przyjazny komunikat i przycisk zachęcający do stworzenia pierwszej.

*   ID: US-011
*   Tytuł: Wyświetlanie szczegółów wycieczki
*   Opis: Jako uczestnik wycieczki, chcę móc zobaczyć wszystkie jej szczegóły na dedykowanej stronie, aby mieć dostęp do pełnych informacji.
*   Kryteria akceptacji:
    *   Kliknięcie na wycieczkę z listy przenosi mnie na jej stronę szczegółów.
    *   Na stronie widzę tytuł, opis, daty, listę uczestników, postęp głosowania.
    *   Poniżej szczegółów znajduje się sekcja komentarzy.
    *   Dostępne akcje (np. edycja, zapraszanie) zależą od mojej roli (właściciel vs uczestnik).

*   ID: US-012
*   Tytuł: Edycja wycieczki przez właściciela
*   Opis: Jako właściciel wycieczki, chcę móc edytować jej szczegóły, aby zaktualizować plan w razie potrzeby.
*   Kryteria akceptacji:
    *   Na stronie wycieczki, której jestem właścicielem, widzę przycisk "Edytuj".
    *   Mogę edytować wszystkie pola: tytuł, opis, daty, limit uczestników, próg "lajków".
    *   Edycja jest możliwa tylko do daty zakończenia wycieczki.
    *   Inni uczestnicy są informowani o zmianach (np. poprzez wskaźnik nowej aktywności).

*   ID: US-013
*   Tytuł: Usunięcie wycieczki przez właściciela
*   Opis: Jako właściciel wycieczki, chcę móc ją usunąć, jeśli plany zostaną anulowane.
*   Kryteria akceptacji:
    *   Na stronie wycieczki, której jestem właścicielem, widzę opcję "Usuń".
    *   Proces usunięcia wymaga dwuetapowego potwierdzenia, w tym wpisania nazwy wycieczki.
    *   Po usunięciu, wycieczka jest trwale kasowana z systemu dla wszystkich uczestników.

*   ID: US-014
*   Tytuł: Opuszczenie wycieczki przez uczestnika
*   Opis: Jako uczestnik, chcę móc opuścić wycieczkę, jeśli nie mogę lub nie chcę już w niej brać udziału.
*   Kryteria akceptacji:
    *   Na stronie wycieczki, w której uczestniczę (ale nie jestem właścicielem), widzę przycisk "Opuść wycieczkę".
    *   Po potwierdzeniu, jestem usuwany z listy uczestników i tracę dostęp do szczegółów wycieczki.

### Uczestnicy i Zaproszenia

*   ID: US-015
*   Tytuł: Zapraszanie uczestników do wycieczki
*   Opis: Jako właściciel wycieczki, chcę móc zapraszać znajomych, podając ich adresy e-mail, aby mogli dołączyć do planowania.
*   Kryteria akceptacji:
    *   Na stronie wycieczki znajduje się opcja "Zaproś".
    *   Mogę wkleić jeden lub wiele adresów e-mail (np. oddzielonych przecinkiem).
    *   System wysyła e-mail z zaproszeniem i magicznym linkiem do każdego z podanych adresów.
    *   Zaproszenie jest wysyłane tylko na adresy, które jeszcze nie są uczestnikami wycieczki.
    *   Akcja jest potwierdzana komunikatem (toast notification).

*   ID: US-016
*   Tytuł: Usuwanie uczestników z wycieczki przez właściciela
*   Opis: Jako właściciel wycieczki, chcę mieć możliwość usunięcia uczestnika z wycieczki.
*   Kryteria akceptacji:
    *   Na liście uczestników przy każdym z nich (oprócz mnie) znajduje się opcja "Usuń".
    *   Po potwierdzeniu, wybrany użytkownik jest usuwany z listy uczestników i traci dostęp do wycieczki.

*   ID: US-017
*   Tytuł: Akceptacja zaproszenia do wycieczki
*   Opis: Jako osoba zaproszona, chcę móc łatwo dołączyć do wycieczki po otrzymaniu e-maila.
*   Kryteria akceptacji:
    *   Otrzymuję e-mail z informacją o zaproszeniu i magicznym linkiem.
    *   Jeśli nie mam konta, link prowadzi mnie przez proces rejestracji, a następnie automatycznie dodaje do wycieczki.
    *   Jeśli mam już konto, link loguje mnie i dodaje do wycieczki, a następnie przekierowuje na jej stronę.

### Głosowanie i Interakcje

*   ID: US-018
*   Tytuł: Głosowanie na wycieczkę (Like)
*   Opis: Jako uczestnik wycieczki, chcę móc zagłosować "lajkiem", aby zadeklarować chęć udziału.
*   Kryteria akceptacji:
    *   Na stronie wycieczki widzę przycisk "Like" (lub podobny).
    *   Mogę oddać tylko jeden głos. Ponowne kliknięcie cofa mój głos.
    *   Licznik głosów aktualizuje się w czasie rzeczywistym dla wszystkich uczestników.
    *   Głosowanie jest możliwe tylko wtedy, gdy właściciel nie zablokował tej opcji.

*   ID: US-019
*   Tytuł: Zarządzanie głosowaniem przez właściciela
*   Opis: Jako właściciel wycieczki, chcę móc zablokować i odblokować możliwość głosowania, aby zamknąć listę chętnych w odpowiednim momencie.
*   Kryteria akceptacji:
    *   Na stronie wycieczki, której jestem właścicielem, znajduje się przełącznik "Zablokuj/Odblokuj głosy".
    *   Gdy głosy są zablokowane, uczestnicy nie mogą głosować ani cofać głosów. Widzą odpowiedni komunikat.
    *   Stan blokady jest widoczny dla wszystkich uczestników.

*   ID: US-020
*   Tytuł: Dodawanie komentarza do wycieczki
*   Opis: Jako uczestnik wycieczki, chcę móc dodawać komentarze, aby dyskutować o planach z innymi.
*   Kryteria akceptacji:
    *   Pod szczegółami wycieczki znajduje się pole do wpisania i wysłania komentarza.
    *   Po wysłaniu, mój komentarz pojawia się na końcu listy komentarzy.
    *   Wszyscy uczestnicy widzą mój komentarz.
    *   Dodanie komentarza powoduje pojawienie się wskaźnika nowej aktywności u innych uczestników.

*   ID: US-021
*   Tytuł: Edycja własnego komentarza
*   Opis: Jako autor komentarza, chcę mieć możliwość jego edycji, aby poprawić błędy lub zaktualizować treść.
*   Kryteria akceptacji:
    *   Przy moich własnych komentarzach widzę opcję "Edytuj".
    *   Po kliknięciu, treść komentarza staje się edytowalna.
    *   Po zapisaniu zmian, zaktualizowana treść jest widoczna dla wszystkich.
    *   Przy edytowanym komentarzu może pojawić się znacznik "(edytowano)".

*   ID: US-022
*   Tytuł: Usuwanie własnego komentarza
*   Opis: Jako autor komentarza, chcę móc go usunąć.
*   Kryteria akceptacji:
    *   Przy moich własnych komentarzach widzę opcję "Usuń".
    *   Po potwierdzeniu, mój komentarz jest trwale usuwany z dyskusji.

### Archiwum i Wyszukiwanie

*   ID: US-023
*   Tytuł: Automatyczna archiwizacja wycieczki
*   Opis: Jako uczestnik, chcę aby zakończone wycieczki były automatycznie przenoszone do archiwum, aby nie zaśmiecały listy aktywnych planów.
*   Kryteria akceptacji:
    *   Dzień po dacie zakończenia, wycieczka automatycznie zmienia status na "zarchiwizowana".
    *   Zarchiwizowana wycieczka znika z listy aktywnych wycieczek i pojawia się na liście archiwalnych.
    *   Wszystkie dane zarchiwizowanej wycieczki (opis, uczestnicy, komentarze) są dostępne w trybie "tylko do odczytu".

*   ID: US-024
*   Tytuł: Dodawanie tagów do zarchiwizowanej wycieczki
*   Opis: Jako uczestnik, chcę móc dodawać tagi do zarchiwizowanych wycieczek, aby łatwiej kategoryzować wspomnienia.
*   Kryteria akceptacji:
    *   Na stronie zarchiwizowanej wycieczki znajduje się pole do dodawania tagów.
    *   Mogę wpisać dowolne tagi (jako wolny tekst, np. oddzielone przecinkiem).
    *   Dodane tagi są widoczne dla wszystkich uczestników tej wycieczki.

*   ID: US-025
*   Tytuł: Wyszukiwanie zarchiwizowanych wycieczek po tagach
*   Opis: Jako użytkownik, chcę móc wyszukać zarchiwizowane wycieczki po tagach, aby szybko znaleźć wspomnienia z konkretnego typu wyjazdu.
*   Kryteria akceptacji:
    *   Na stronie archiwum znajduje się pole wyszukiwania.
    *   Wpisanie taga w pole wyszukiwania filtruje listę wycieczek, pokazując tylko te, które posiadają dany tag.

### Przypadki Brzegowe

*   ID: US-026
*   Tytuł: Przeniesienie własności wycieczki po usunięciu konta właściciela
*   Opis: Jako uczestnik aktywnej wycieczki, chcę, aby wycieczka nadal funkcjonowała, nawet jeśli jej pierwotny właściciel usunie swoje konto.
*   Kryteria akceptacji:
    *   Gdy właściciel aktywnej wycieczki usuwa swoje konto, system automatycznie przypisuje własność nowej osobie.
    *   Nowym właścicielem zostaje uczestnik, który dołączył do wycieczki jako pierwszy po założycielu.
    *   Wszyscy uczestnicy wycieczki pozostają bez zmian.
    *   Jeśli właściciel był jedynym uczestnikiem, wycieczka jest usuwana razem z jego kontem.

## 6. Metryki sukcesu

Powodzenie projektu będzie mierzone na podstawie następujących kluczowych wskaźników (KPI), które odzwierciedlają zaangażowanie użytkowników i realizację głównego celu aplikacji.

*   Główny Cel: Udany wyjazd zaplanowany przy pomocy aplikacji.

*   Mierzalne Wskaźniki dla MVP:
    1.  Aktywacja: Liczba nowo utworzonych wycieczek w danym okresie (np. tygodniowo/miesięcznie). Celem jest stały wzrost tego wskaźnika.
    2.  Zaangażowanie:
        *   Średnia liczba uczestników na wycieczkę.
        *   Średnia liczba komentarzy na aktywną wycieczkę.

