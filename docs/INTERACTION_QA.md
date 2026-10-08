# Interaction refinement · 2026-10-08

- Shorter page entrances (180 ms), shared dialog dismissal (150 ms), restrained
  pointer/press/focus feedback and animated map selection. Reduced-motion users
  receive immediate dismissal and no new transitional animation.
- Desktop headers and collection spacing are more compact; martial-card actions
  align toward the bottom of their cards. The approved paper/ink palette remains.
- Browsing positions, person/equipment searches and martial categories survive
  navigation during the current session. Starting or loading a game clears this
  browsing state. None of it is written into gameplay saves.
- Shared dialogs restore focus without scrolling, clean up their dismissal timer
  and scroll lock on unmount, and preserve non-dismissible story/combat dialogs.
- Filter buttons support Left/Right/Home/End; all remain reachable with Tab.

## Browser checks

Desktop 1440×900 and mobile 390×844 were inspected using the built production app.
Equipment search `铁` and martial category `剑法` survived leaving and returning.
Person search `白` survived viewing 白芷 and returning to the list. Escape triggered
the item dialog's departure, then removed it, restored its opening button's focus,
and released the body scroll lock. The phone item dialog fit inside the viewport.
After disabling native scroll anchoring in the game layout, a phone inventory
round trip through the map restored scrollY 1441.333 to 1441.333; the new map opened
at zero. No horizontal overflow or browser console warnings/errors were observed.

73 existing tests passed across 10 files; production TypeScript/Vite build passed.
Reduced-motion handling was checked in code; it was not emulated in the browser.
