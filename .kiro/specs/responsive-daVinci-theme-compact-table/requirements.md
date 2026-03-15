# Requirements Document

## Introduction

This feature delivers three coordinated improvements to the DataGrid / GenericGrid UI in the Frontend-Engine project:

1. **Responsive Layout** — the grid adapts to any viewport width; horizontal overflow is contained within the table scroll container rather than propagating to the page, and the toolbar reflows gracefully at narrow widths.
2. **DaVinci Theme Alignment** — colors, typography, spacing, and Quasar component tokens are updated to match the DaVinci design system, replacing the current Enterprise Slate palette while preserving dark-mode support.
3. **Compact Table Layout** — row height, cell padding, and font size are reduced so that more rows are visible without scrolling, improving usability with large datasets.

The implementation targets Vue 3 + TypeScript, Quasar 2.18.6, Tailwind CSS 4.1.14 (tw- prefix), and TanStack Vue Table 8.21.3 with virtual scrolling.

---

## Glossary

- **DataGrid**: The core grid component (`DataGrid.vue`) that renders the virtual-scrolled table, header, and body rows.
- **GenericGrid**: The page-level wrapper (`GenericGrid.vue`) that owns data fetching, infinite scroll, and composes DataGrid with GridToolbar.
- **GridToolbar**: The toolbar component (`GridToolbar.vue`) providing search, filter, column visibility, grouping, and role controls.
- **DaVinci_Theme**: The DaVinci design-system token set — a specific palette of colors, typography scale, and spacing values that must be applied consistently across the platform.
- **Compact_Mode**: A layout variant where row height is reduced to 36 px, cell vertical padding is 4 px, and body font size is 12 px, enabling more rows to be visible simultaneously.
- **Virtual_Scroller**: The TanStack `useVirtualizer` instance inside DataGrid that renders only the rows currently in the viewport.
- **Table_Container**: The `<div ref="tableContainerRef">` element inside DataGrid that owns the `overflow-auto` scroll context for the table.
- **Tailwind**: Tailwind CSS 4.1.14 configured with the `tw-` utility prefix.
- **CSS_Variables**: The HSL-based custom properties declared in `index.css` that drive both Tailwind theme tokens and Quasar overrides.

---

## Requirements

### Requirement 1: Contained Horizontal Scrolling

**User Story:** As a user viewing the grid on a narrow screen or with many columns, I want horizontal scrolling to be contained within the table area, so that the page layout does not shift and the toolbar and status bar remain fully visible at all times.

#### Acceptance Criteria

1. THE Table_Container SHALL apply `overflow-x: auto` so that horizontal overflow is scrolled within the container and does not cause the page body to scroll horizontally.
2. WHEN the total column width exceeds the Table_Container width, THE DataGrid SHALL display a horizontal scrollbar inside the Table_Container without affecting the GenericGrid page layout.
3. WHILE the user scrolls horizontally inside the Table_Container, THE DataGrid header row SHALL remain horizontally aligned with the body columns (sticky header must track horizontal scroll).
4. THE GenericGrid page layout SHALL maintain `overflow: hidden` on the outermost container so that no horizontal scrollbar appears at the browser window level.
5. WHEN the viewport width is below 768 px, THE GridToolbar SHALL reflow its controls into a stacked layout with a minimum touch target height of 44 px per interactive element.
6. THE DataGrid status bar SHALL remain visible at the bottom of the grid container regardless of horizontal scroll position.

---

### Requirement 2: DaVinci Theme Alignment

**User Story:** As a user of the platform, I want the DataGrid UI to look visually consistent with the DaVinci design system, so that the grid feels like a native part of the platform rather than a separately styled component.

#### Acceptance Criteria

1. THE CSS_Variables in `index.css` SHALL be updated to reflect the DaVinci_Theme color palette for all semantic tokens (`--primary`, `--secondary`, `--background`, `--foreground`, `--border`, `--muted`, `--accent`, `--destructive`, and their foreground counterparts).
2. THE `quasar-variables.sass` file SHALL be updated so that `$primary`, `$secondary`, `$accent`, `$positive`, `$negative`, `$info`, and `$warning` match the corresponding DaVinci_Theme color values.
3. WHEN the `.dark` class is present on a parent element, THE DataGrid SHALL apply the DaVinci_Theme dark-mode token values for all CSS_Variables, maintaining WCAG AA contrast ratios between foreground and background tokens.
4. THE DataGrid header row SHALL use the DaVinci_Theme surface/header background color token (`--color-muted`) and the DaVinci_Theme header text color token (`--color-muted-foreground`) for column labels.
5. THE DataGrid data rows SHALL alternate background colors using the DaVinci_Theme row-stripe tokens derived from `--color-background` and `--color-muted` at 40% opacity.
6. WHEN a data row is hovered, THE DataGrid SHALL apply the DaVinci_Theme hover token (`--color-accent`) as the row background color.
7. THE GridToolbar SHALL use DaVinci_Theme surface color (`--color-card`) as its background and DaVinci_Theme border token (`--color-border`) for its bottom border.
8. THE DataGrid group header rows SHALL use the DaVinci_Theme primary color at 10% opacity as the background, with the primary foreground token for text.
9. WHERE a Quasar component (QCheckbox, QBtn, QInput, QSelect, QChip, QBadge, QSkeleton) is rendered inside DataGrid or GridToolbar, THE DataGrid SHALL apply DaVinci_Theme color tokens via Quasar's CSS variable overrides so that Quasar components visually match the DaVinci_Theme.
10. THE font family for all grid text SHALL be set to the DaVinci_Theme sans-serif font stack via the `--font-sans` CSS variable.

---

### Requirement 3: Compact Table Layout

**User Story:** As a user working with large datasets, I want the table rows to be more compact, so that I can see more data on screen at once without scrolling.

#### Acceptance Criteria

1. THE DataGrid SHALL support a `compact` boolean prop that, when `true`, activates Compact_Mode for the entire grid.
2. WHEN `compact` is `true`, THE Virtual_Scroller SHALL use a row height of 36 px instead of the default 53 px.
3. WHEN `compact` is `true`, THE DataGrid body cells SHALL apply 4 px vertical padding and 8 px horizontal padding.
4. WHEN `compact` is `true`, THE DataGrid body cell text SHALL render at 12 px font size.
5. WHEN `compact` is `true`, THE DataGrid header cells SHALL apply 4 px vertical padding and 8 px horizontal padding, with header text at 11 px font size and uppercase letter-spacing preserved.
6. WHEN `compact` is `true`, THE DataGrid skeleton loading rows SHALL use 36 px row height to match the compact row height.
7. WHEN `compact` is `false` or omitted, THE DataGrid SHALL use the default row height of 53 px and default cell padding, preserving existing behavior.
8. THE GridToolbar SHALL expose a compact-mode toggle button that emits a `compact-changed` event with the new boolean value when clicked.
9. WHEN the GridToolbar emits `compact-changed`, THE GenericGrid SHALL pass the updated value to the DataGrid `compact` prop.
10. THE DataGrid status bar SHALL display the active layout mode label ("Compact" or "Standard") alongside the total row count.

---

### Requirement 4: Virtual Scroller Row Height Consistency

**User Story:** As a developer maintaining the grid, I want the virtual scroller row height to always match the rendered row height, so that scroll position calculations remain accurate and rows do not overlap or leave gaps.

#### Acceptance Criteria

1. THE Virtual_Scroller estimated row size SHALL be derived from a single shared constant (`ROW_HEIGHT_DEFAULT = 53`, `ROW_HEIGHT_COMPACT = 36`) rather than hardcoded literals scattered across the component.
2. WHEN the `compact` prop changes at runtime, THE Virtual_Scroller SHALL reinitialize with the updated row height so that all virtual item positions are recalculated.
3. IF the rendered height of a row differs from the Virtual_Scroller estimated size by more than 2 px, THEN THE Virtual_Scroller SHALL use dynamic measurement to correct the offset for subsequent renders.
4. THE overscan count SHALL remain at 10 rows in both default and Compact_Mode to maintain smooth scrolling performance.

---

### Requirement 5: Responsive Toolbar Layout

**User Story:** As a user on a tablet or small desktop, I want the toolbar controls to remain accessible and usable at any viewport width, so that I can search, filter, and manage columns without horizontal overflow.

#### Acceptance Criteria

1. THE GridToolbar SHALL use a CSS flex-wrap layout so that controls wrap to a second line when the available width is insufficient to display them in a single row.
2. WHEN the viewport width is below 1024 px, THE GridToolbar label text on icon-buttons (Columns, Group By, Export) SHALL be hidden, showing only the icon, to conserve horizontal space.
3. WHEN the viewport width is below 768 px, THE GridToolbar search input SHALL expand to full available width on its own line.
4. THE GridToolbar minimum height SHALL expand to accommodate wrapped controls without clipping any interactive element.
5. WHERE container queries are supported by the browser, THE GridToolbar SHALL use a CSS container query on the toolbar's own width rather than the viewport width for breakpoint decisions, so that the toolbar responds correctly when embedded in variable-width layouts.

---

### Requirement 6: Theme Token Round-Trip Consistency

**User Story:** As a developer integrating the DaVinci theme, I want all color tokens to be defined in exactly one place and consumed everywhere else by reference, so that a single token change propagates correctly to all components.

#### Acceptance Criteria

1. THE CSS_Variables in `index.css` SHALL be the single source of truth for all color values; no hex or HSL color literals SHALL appear in `DataGrid.vue`, `GenericGrid.vue`, or `GridToolbar.vue` Tailwind class strings or inline styles.
2. THE `quasar-variables.sass` values SHALL reference the same DaVinci_Theme palette constants as `index.css` so that Quasar component colors and Tailwind utility colors are derived from the same source values.
3. WHEN a CSS_Variable token is updated in `index.css`, THE DataGrid, GenericGrid, and GridToolbar SHALL reflect the updated color without requiring changes to any Vue component file.
