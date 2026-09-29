# White Theme Specification

**Status:** Proposed for review

**Scope:** Visual design and browser-local theme preference

**Implementation gate:** This specification PR must be reviewed and approved before implementation begins.

## References

- [Dashboard design reference](assets/white-theme-dashboard-reference.png) (1672 x 941 desktop screenshot)
- [Supplied light hero image](../../public/hero.png) (2027 x 776 PNG)

The design reference is a visual target, not a source of application instructions or sample data. The supplied hero image is the production asset for the light dashboard hero. Its English copy is part of the bitmap and must remain unchanged when the application language changes.

## Goal

Add a selectable white theme that closely matches the supplied dashboard screenshot at desktop sizes, then carry its visual language through the rest of the application. The existing dark theme remains the initial default and retains its current appearance. The project must continue to use live data and existing workflows in either theme.

## Scope

- Include the protected shell, Dashboard, Orders, Main Sheet, Call List, Booking, Archive, Freeze, Reports, search results, settings, dialogs, forms, grids, charts, notifications, loading states, and error states.
- Include the login, forgot-password, and reset-password pages. They use their own layouts, but follow the selected theme.
- Exclude `/mobile-order` and its public intake flow. That feature is planned for removal separately; this project does not redesign or retheme it.
- Focus visual matching and review on desktop. Do not introduce a dedicated mobile redesign. Preserve existing layouts and working controls on smaller screens.
- The first PR contains this specification and the two reference assets only. UI implementation starts in a later change after approval.

## Theme Behavior

1. Offer explicit **Dark** and **White** choices in `Settings > Theme`, replacing its current placeholder. Do not add a theme control to the reference header or a system-theme option in this phase.
2. Start in Dark when no choice has been saved. Save a user's explicit choice in browser-local storage and apply it on later visits in that browser.
3. Apply the saved choice throughout the in-scope protected and authentication pages, including before login. A choice made in one browser does not need to sync to another device or account.
4. Switching themes updates the visible application without losing the current route, draft session, form contents, selection, scroll position, or server data.
5. Avoid an incorrect-theme flash during initial load. Keep the current dark appearance when no saved preference exists.
6. Do not change the existing dark palette, layout, copy, interactions, or workflow behavior as part of this work.

## White Theme Visual Requirements

### Shared Shell

- Match the reference's black left sidebar, yellow brand and active-navigation accents, white content canvas, and light header. Keep the existing navigation destinations, order, labels, and account controls.
- Use near-white surfaces, restrained gray borders and shadows, black primary text, muted gray secondary text, and the existing yellow brand accent. Avoid dark translucent overlays on white surfaces.
- Restyle existing search, command, notification, export, and other header controls to match the light outlined treatment in the reference. Retain their current functions and enabled or disabled states.
- Use the reference's proportions, spacing, typography hierarchy, icon sizing, and compact operational feel where the existing shell permits. Do not add controls solely because a shape in the screenshot suggests one.

### Dashboard

- Use `public/hero.png` as the white-theme hero background. Keep the entire baked-in heading, supporting text, and workshop composition legible at the reference desktop viewport; do not duplicate that copy in HTML. The dark hero keeps its current asset.
- Match the reference's hero frame, light stat tiles, bottom-right calendar, white storage panel, yellow capacity ring, and white stage-distribution panel. The hero image must remain visible behind the stat tiles and calendar.
- Keep Total Pending, Active Orders, Call Queue, storage usage, and stage counts bound to their existing live query results. The numbers visible in the reference are illustrative, not hard-coded targets.
- Show chart values and labels in a style close to the reference, using current data. Preserve the existing chart data source and calculation rules.
- Stat tiles and calendar dates remain noninteractive. In White, do not present them as actionable through pointer cursors, hover promises, or misleading affordances. Existing functional dashboard actions remain functional; Dark retains its current appearance.

### Other In-Scope Pages

- Extend the same black, white, gray, and yellow visual system to stage toolbars, grids, filter controls, forms, dialogs, settings, search results, reports, status indicators, and system feedback.
- Preserve each page's information hierarchy, field order, navigation, data flow, validation, query keys, draft commands, and save behavior. Visual treatment may change; business behavior must not.
- Give AG Grid and its menus, editors, selections, loading states, and empty states a coherent light appearance. Keep contrast and status meaning clear, including color-coded statuses.
- Adapt authentication pages to the white palette without copying the protected sidebar or header into their separate layouts.

## Quality And Acceptance

- At 1672 x 941, a side-by-side Dashboard comparison reads as a close match to the supplied reference, including shell, hero placement, cards, calendar, storage panel, chart, colors, and spacing. Check another common desktop width to catch cropping and overflow.
- The full baked-in hero copy remains readable at reviewed desktop widths. The hero is not duplicated as live text and does not change language with the app.
- Every in-scope route can be viewed in both themes. White surfaces, text, borders, icons, focus indicators, overlays, and feedback states remain readable and visually consistent.
- Dark is the default on a fresh browser. The selected theme persists after refresh and navigation, and applies on the authentication pages. Theme changes do not clear unsaved work.
- Existing business actions, live figures, search, stage transitions, exports, and authentication continue to work. Decorative stat and calendar elements do not acquire new actions.
- No intentional visual or behavioral changes appear in Dark. `/mobile-order` is unchanged.
- Implementation verification includes relevant focused tests, desktop visual review, `pnpm run lint`, `pnpm run type-check`, `pnpm run test`, and `pnpm run build` before merge, per repository quality gates.

## Delivery Sequence

1. Review and approve this specification-only PR, including the reference screenshot and `hero.png`.
2. Implement the theme in the isolated worktree after approval, keeping the dark theme and existing workflows intact.
3. Review desktop screenshots for the Dashboard and representative protected and authentication pages in both themes; run the repository quality gates.
4. Update feature and architecture documentation to reflect the implemented theme behavior, then submit the implementation for separate review.
