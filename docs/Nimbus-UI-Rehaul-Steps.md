# Nimbus UI Rehaul — Step-by-step Plan (r2modmanPlus)

This document is the canonical checklist for completing the Nimbus-aligned UX/UI rehaul.

Goals
- Align UI look/feel with Nimbus component + token system.
- Keep changes isolated/reviewable (Nimbus CSS + components) while migrating.
- Minimize behavior changes; prioritize markup/class refactors over logic changes.
- Proceed view-by-view, recursively descending into child components/modals.
- Maintain a fast validation loop (single-spec Vitest sanity run).

Non-goals
- No feature work, logic rewrites, or flow changes unless required for UI correctness.
- No global “big bang” redesign that risks unrelated regressions.

Guiding constraints
- Scope Nimbus styling with `.nimbus-scope` to avoid global regressions.
- Keep Nimbus styles under `src/css/nimbus/**`.
- Prefer Nimbus primitives/utilities/components over Bulma constructs.
- Temporary compatibility is allowed via `src/css/nimbus/bulma-bridge.scss`, but the end state is to remove dependence on it.

---

## Current status (auto-inventory snapshot)

This section is a “what to do next” snapshot. Update it as migrations land.

Remaining high-signal legacy usage found in `.vue` templates (Jan 2026)
- Card internals are still widely used: `card-header`, `card-content`, `card-footer-item`, `card-header-icon`.
- Remaining legacy notifications exist in:
  - `src/components/modals/ErrorModal.vue` (`notification is-danger`)
  - `src/components/config-components/ConfigRawEditor.vue` (`notification`)

Remaining high-signal legacy usage found in `.scss` (Jan 2026)
- `src/css/v2/components/_card.scss` still defines `.card-header-title` (now unused in templates, but still a legacy dependency point).
- `src/css/v2/components/_notification.scss`, `_tabs.scss`, `_menu.scss` define legacy component styles.
- `src/css/custom.scss` still contains `.tabs`, `.menu`, and card-footer styling.
- `src/css/nimbus/bulma-bridge.scss` still includes selectors for `.card-*`, `.notification`, `.tabs`, `.menu`.

### Next 5 targets (priority order)

1) Migrate “card footer actions” to Nimbus
- Replace `card-footer-item` usage in:
  - `src/components/views/LocalModList/LocalModCard.vue`
  - `src/components/views/OnlineModList.vue`
  - `src/components/config-components/ConfigSelectionLayout.vue`
  - `src/components/buttons/DonateButton.vue`
- Likely replacement: introduce a Nimbus action row primitive (e.g. `.nimbus-actions`) or use existing `.nimbus-toolbar` with link/button styling.

2) Migrate `card-header` / `card-content` usage in shared card components
- Remove remaining Bulma card internals from:
  - `src/components/ExpandableCard.vue` (still uses `card-header`, `card-content`, `card-footer`)
  - `src/components/OnlineRowCard.vue` (still uses `card-header`)
- Goal: shared cards render Nimbus surfaces/spacing without depending on Bulma card structure.

3) Replace `card-header-icon` patterns
- Migrate header icon wrappers in:
  - `src/components/views/OnlineModListWithPanel.vue`
  - `src/components/views/OnlineModList.vue`
  - `src/components/buttons/DonateIconButton.vue`
  - `src/components/views/LocalModList/LocalModCard.vue`

4) Convert remaining legacy notification blocks
- Migrate:
  - `src/components/modals/ErrorModal.vue` → `nimbus-notification nimbus-notification--danger`
  - `src/components/config-components/ConfigRawEditor.vue` → `nimbus-notification`

5) Start shrinking legacy CSS once callers are migrated
- After the above, remove or reduce legacy styling from:
  - `src/css/v2/components/_card.scss`
  - `src/css/v2/components/_notification.scss`
  - `src/css/v2/components/_tabs.scss`
  - `src/css/v2/components/_menu.scss`
  - `src/css/custom.scss` blocks that only support legacy classes
  - `src/css/nimbus/bulma-bridge.scss` selectors no longer needed

---

## Phase 0 — Inventory + guardrails

1) Create (or update) a top-level inventory of remaining legacy/Bulma usage
- Search targets (run regularly):
  - `card-header`, `card-content`, `card-footer-item`
  - `notification`, `tabs`, `menu`
  - `columns`, `level`, `media`
  - `container`, `is-flex`, `is-justify-content-*`, `is-align-items-*`
- Record the hotspots (pages/components) to tackle next.

2) Define the “done” definition for each migration unit
- Visual: uses Nimbus tokens + surfaces; no Bulma-only visual styling required.
- Structural: no Bulma structural layout helpers in the migrated scope.
- Safety: behavior unchanged; events, v-model, routing, store calls remain the same.
- Test gate: Vitest sanity spec passes.

3) Establish quick validation commands
- Primary sanity gate:
  - `yarn vitest run test/vitest/tests/unit/example.spec.ts`
- (Optional) Narrow additional specs if/when introduced later.

---

## Phase 1 — Nimbus foundations (must be in place)

4) Nimbus scope boundary
- Ensure core views that are being migrated wrap their content in `.nimbus-scope`.
- Prefer placing `.nimbus-scope` at a stable layout boundary (route root, major panel root).

5) Nimbus CSS bundle wiring
- Ensure Nimbus bundle is imported once via the app-level stylesheet.
- Nimbus CSS structure should remain:
  - `src/css/nimbus/index.scss`
  - `src/css/nimbus/layout.scss` (layout primitives)
  - `src/css/nimbus/islands.scss` (island wrappers)
  - `src/css/nimbus/components.scss` (tabs/menu/notification/card/etc)
  - `src/css/nimbus/bulma-bridge.scss` (temporary compatibility)

6) Nimbus primitives / tokens
- Confirm layout primitives exist and have safe fallback values:
  - `.nimbus-stack`, `.nimbus-inline`, `.nimbus-toolbar`, `.nimbus-container`, `.nimbus-spacer`
- Confirm component primitives exist:
  - `.nimbus-tabs`, `.nimbus-menu`, `.nimbus-notification`, `.nimbus-card` (+ variants)

---

## Phase 2 — Route-level migration (view-by-view)

For each route/page:

7) Wrap the view in `.nimbus-scope` (if not already)
- Keep scoping tight but not brittle (avoid attaching to ephemeral inner nodes).

8) Replace Bulma structural layout helpers
- Replace `columns/column` with:
  - `.nimbus-stack` for vertical layout
  - `.nimbus-inline` or `.nimbus-toolbar` for horizontal groups
- Replace `level` / `media` patterns with `.nimbus-toolbar` + groups.
- Replace `.container` with `.nimbus-container`.
- Replace `is-flex` / `is-flex-grow-*` with `.nimbus-toolbar__grow` / `.nimbus-spacer`.

9) Convert common UI patterns to Nimbus components
- Tabs: Bulma `.tabs` → `.nimbus-tabs`
- Menus: Bulma `.menu` → `.nimbus-menu`
- Notifications/alerts: Bulma `.notification` → `.nimbus-notification` (+ variants)
- Cards (where appropriate): Bulma `.card` → `.nimbus-card`

10) Migrate local view styles
- Keep existing view-specific CSS where it’s not Bulma-coupled.
- If a style exists purely to “fix Bulma”, move it into Nimbus CSS or remove it once not needed.

11) Validate after each view
- Run the sanity spec.
- Smoke-check the view manually if possible (especially modals, scroll areas, sticky headers).

---

## Phase 3 — Component recursion (child components + modals)

For each migrated page, recursively migrate its direct children:

12) Identify child components rendered by the view
- Start with top-level slots/panels/modals.
- Then recurse into those components’ children.

13) Apply the same migration rules (layout → component patterns)
- Strip Bulma structure first.
- Replace component constructs second.
- Avoid changing props/events/slots.

14) Pay extra attention to modals
- Ensure padding and spacing stays correct.
- Ensure focus/keyboard behaviors remain unchanged.

15) Validate after each migration batch
- Sanity spec.

---

## Phase 4 — Shared primitives & “high fan-out” components

These are components used widely and should be migrated carefully.

16) Identify shared components still Bulma-coupled
Examples of targets:
- Row-card / expandable-card style components
- Card header/footer patterns
- Shared list item wrappers

17) Create/extend Nimbus equivalents only when needed
- Prefer CSS primitives first.
- If a Vue component abstraction is needed, create it under `src/components/nimbus/**`.

18) Migrate callers gradually
- Change one high-traffic caller first.
- Validate.
- Proceed outward to other callers.

19) Remove per-component Bulma assumptions
- Avoid `card-header-*`, `card-footer-item`, `card-content` in shared components.
- Replace titles with `.nimbus-card__title` (or introduce a dedicated “title” primitive if required).

---

## Phase 5 — Reduce and remove the Bulma bridge

20) Measure what the bridge still covers
- Track which Bulma selectors are still required for legacy pockets.

21) Shrink bridge coverage in small PR-sized chunks
- Remove selectors that are no longer used.
- Validate.

22) End state
- The bridge is either deleted or reduced to only truly global legacy necessities.

---

## Phase 6 — UX polish + consistency pass

23) Spacing and density consistency
- Standardize padding/margins in headers/toolbars/cards.
- Prefer Nimbus token-driven spacing.

24) Typography consistency
- Ensure titles, subtitles, and body text align with Nimbus token usage.

25) Interaction states
- Hover/focus/active states should be Nimbus-consistent.
- Confirm keyboard focus is visible and not broken.

---

## Phase 7 — QA + finishing gates

26) Regression scan
- Run searches to confirm legacy classes are gone (or isolated):
  - `columns`, `level`, `media`, `container`
  - `card-header`, `card-content`, `card-footer-item`
  - `notification`, `tabs`, `menu`
  - `is-flex*`

27) Build/run sanity
- Run the Vitest sanity spec.
- Optionally run a broader test subset if available and stable.

28) Manual smoke checklist (quick)
- Game selection (list + grid)
- Manager main view
- Profile management
- Settings view (search + navigation)
- Online browser (filters/search)
- Core modals: errors, game-running, install/uninstall/disable

---

## Working style (repeatable loop)

A) Pick the next view/component from the inventory.
B) Replace structural Bulma layout with Nimbus primitives.
C) Replace component patterns (tabs/menu/notification/card).
D) Remove now-unused bridge dependencies.
E) Run `yarn vitest run test/vitest/tests/unit/example.spec.ts`.
F) Commit-sized batch; move to the next child component.
