# Fokus nie wracał na przycisk „Filtry"

Status: resolved
Oryginalna pozycja listy: — (znalezione przy weryfikacji U2)

## Problem

`BottomSheet` przywraca focus na element otwierający przez `triggerRef`.
`FilterModal` był jedynym, który tego ref-a nie przekazywał — `CollectionSwitcherSheet`
i `MoreSheet` robiły to poprawnie.

Skutek: po zamknięciu sheetu filtrów `document.activeElement` wskazywał `<body>`.
Użytkownik klawiatury po zamknięciu panelu lądował na początku dokumentu
i musiał nawigować od nowa. WCAG 2.4.3 (Focus Order).

Nie było tego widać gołym okiem — znalazłem to, sprawdzając `document.activeElement`
po naciśnięciu Escape w teście U2.

## Rozwiązanie

Przewleczony ref: `MobileBottomNav` → `App` (`filtersButtonRef`) → `FilterModal`
→ `BottomSheet`.

Przy okazji `aria-haspopup="dialog"` na przyciskach „Filtry" i „Więcej"
(przycisk „Banknoty" już to miał — brakowało spójności).

## Commit

`0178ae1`

## Comments

Weryfikacja: otwarcie sheetu → `document.activeElement` to panel dialogu;
Escape → 0 dialogów, 0 `inert`, `activeElement` to `BUTTON/Filtry`.

Pierwsza próba testu dała fałszywy negatyw, bo strona była z serwowanego
wcześniej builda. Warto po zmianach w `App.jsx` przeładować stronę, a nie ufać
HMR.
