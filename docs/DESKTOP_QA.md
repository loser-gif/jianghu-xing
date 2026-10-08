# Desktop adaptation · 2026-10-08

The paper-and-ink interface switches to a desktop layout at 1100 CSS pixels.
It uses a persistent navigation rail and a content canvas up to 1680 pixels.
Travel scenes/actions, equipment/bag, character/cultivation and map/location
details use adjacent columns. Martial arts and wide-screen character lists
show multiple cards per row. Creation and the animated title menu also use
the available width. Phones retain their bottom navigation and stacked layout.

## Validation

- Browser viewport checks: 1100×768, 1366×768, 1440×900, 1920×1080 and 390×844.
- No horizontal page overflow in the inspected inventory, martial arts,
  character, map and travel screens at their tested widths.
- Desktop navigation, map selection and the mobile bottom bar checked in the
  actual browser. Equipment portraits and book covers do not overlap text.
- The title painting and weather layer share the same desktop width and mask.
- Remote menu update `407be03` was retained before publishing this adaptation.
- Integrated validation: 73 tests passed across 10 files; production build passed.

These are browser viewport checks, not physical-device performance measurements.
