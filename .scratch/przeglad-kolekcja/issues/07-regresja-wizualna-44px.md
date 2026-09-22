# Regresja wizualna: przyciski 44 px a nagłówek sheeta

Status: needs-info
Oryginalna pozycja listy: U6

## Problem

Podniesienie najmniejszych celów dotykowych do 44 px i powiększenie
najmniejszego tekstu (commit `87ce74f`, wcześniejsza część przeglądu) zmieniło
wysokości elementów. Podejrzenie: w bottom sheetach nagłówek i akcje listy mogły
się przestać zgadzać — odstępy albo wyrównanie.

Nie jest to potwierdzony defekt, tylko niesprawdzony skutek uboczny. Zapisuję to
jako zgłoszenie, żeby nie zniknęło, ale **nie umiem go domknąć bez informacji od
Ciebie**: nie mam zrzutu „przed", nie znam sheeta, który wyglądał źle, a ocena
„czy wygląda dobrze" przez zrzut ekranu jest zgadywaniem.

## Czego potrzebuję

Jedna z tych rzeczy:

- nazwa ekranu / sheeta, który wygląda źle (np. „Więcej na 390 px"),
- zrzut sprzed zmiany albo link do poprzedniego wdrożenia,
- albo wprost: „wygląda dobrze, zamknij".

## Czego nie robić

Nie „poprawiać" odstępów po omacku. Bez punktu odniesienia to zamiana jednej
niepewności na drugą i ryzyko pogorszenia tego, co jest w porządku.

## Comments

Sprawdzone w tej sesji na 390×844 i 1280×900: `MoreSheet`, `FilterModal`,
`CollectionSwitcherSheet` otwierają się i domykają poprawnie, focus wraca,
`inert` działa. Nietypowych wysokości ani obciętych elementów nie zauważyłem —
ale to nie jest to samo co porównanie z wersją sprzed zmiany.
