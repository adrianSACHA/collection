---
name: UI 自動チェック
globs: ["**/*.{tsx,jsx,vue,html,css}"]
alwaysApply: true
description: Po zmianach w kodzie frontendowym automatycznie weryfikuj wygląd i UX
---

- Po każdej modyfikacji plików frontendowych użyj narzędzia Playwright MCP, aby otworzyć http://localhost:5173 i wykonać zrzut ekranu oraz migawkę drzewa dostępności
- Jeśli wykryjesz problemy z kontrastem, dostępnością lub użytecznością, zaproponuj poprawki w kodzie
- Konsultuj standardy WCAG i heurystyki użyteczności
