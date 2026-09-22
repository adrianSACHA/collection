# Toasty: role, warstwa żywa pod modalem, kontrast

Status: resolved
Oryginalna pozycja listy: U7

## Problem

Kontener toastów i pojedyncze toasty miały własne regiony `aria-live`, więc
komunikat był ogłaszany dwukrotnie. Do tego błędy nie były asertywne — leciały
jako `polite`, czyli po tym, co czytnik właśnie czyta.

## Rozwiązanie

- `aria-live` zdjęte z kontenera; rola na pojedynczym toaście:
  `role="alert"` dla błędu (assertive), `role="status"` dla sukcesu/info.
- Kontener dostał `data-inert-exempt`. To wymóg wynikający z pozycji 01:
  `useInertBackground` unieruchamia całe tło modala, a `inert` implikuje
  `aria-hidden` — bez wyjątku komunikat pokazany pod modalem nie dotarłby do
  czytnika. Warstwa toastów musi zostać „żywa".

Zmiana kontenera `aria-live` → rola dziecka: usunięcie kontenera bez dodania roli
dziecku zgubiłoby ogłaszanie zupełnie.

## Commity

`8cd3108` (role), `0178ae1` (`data-inert-exempt`)

## Comments

Kontrast sprawdzony dla trzech wariantów — wszystkie przechodzą AA/AAA z zapasem:

| Wariant | Tekst | Tło | Kontrast |
| ------- | ----- | --- | -------- |
| sukces | `#166534` | `#f0fdf4` | 6,81:1 |
| błąd | `#991b1b` | `#fef2f2` | 7,60:1 |
| info | `#1e40af` | `#eff6ff` | 8,01:1 |

Próg AA to 4,5:1.

Warstwa żywa pod modalem: wstrzyknięty węzeł `role="status"` w kontenerze
`[data-inert-exempt]` przy otwartym sheecie → `ignored: false` w drzewie
dostępności, podczas gdy przycisk tła w tym samym momencie `ignored: true`.

**Nie zrobiono:** testu z prawdziwym czytnikiem ekranu. Weryfikacja opiera się na
drzewie dostępności i na specyfikacji `inert`, nie na odsłuchu.
