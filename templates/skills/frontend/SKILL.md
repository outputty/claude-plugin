---
name: frontend
description: React state and URL sync under rapid input, TanStack Table v9 state, facets and virtualized rows, shadcn recipes (Table scroll, Command items), Tailwind class merging with cn(), ECharts bar charts and SSR probes, hydration mismatches, Astro islands and i18n.
---

# frontend

The frontend traps a strong model still gets wrong, grouped by the problem, with the library named on each line.

## Rapid input and URL sync

- **Debounce, never throttle, `history.replaceState`/`pushState`** (browser) - Chrome silently drops calls past its own rate limit with no error; the visible URL freezes while JS state keeps changing.
- **A short synthetic `replaceState` stress test proves nothing** - a scripted burst did not reproduce the throttle; real, sustained dragging did, on two apps. Test the rate limit with a real gesture.
- **`useDeferredValue` made drag lag worse** (React) - wrapped around a heavy consumer of a shared selection, it restarted discarded renders on every tick and was reverted.
- **Count renders with `console.count()` at the call site** - it survives a backgrounded or automated tab; `requestAnimationFrame` never fires there, and Event Timing reports paint-wait artifacts.
- **Never list `useTable()`'s return value in effect deps** (TanStack Table v9) - it is a fresh wrapper every render while its methods stay stable; the effect tears down and rebuilds every render.
- **Memoize the option and handlers when state feeds both `setOption` and `dispatchAction`** (ECharts in React) - an option rebuilt each render fires a full replace that races the targeted update, and the update never visibly lands. Key `useMemo`/`useCallback` on everything except the hover state.

## Hydration mismatches

- **`useSelector` renders the live store value during hydration** (`@tanstack/react-store`) - it passes the client `getSnapshot` as the server snapshot too. A table whose external atom already holds a non-default value hydrates different rows and raises React #418.
- **Every `client:load` island hydrates independently** (Astro) - an island whose first render reads state another island fills on mount mismatches its built HTML (#418) whenever it hydrates first. Seed it with build-time props through `useSyncExternalStore`'s `getServerSnapshot`.
- **A function prop on an island serializes to `null`** (Astro) - the build passes and the HTML looks right, but hydration reads `null` and the call throws. Pass a serializable key and pick the function inside the component.

## Table state and facets

- **External atoms win** (TanStack Table v9) - precedence is `options.atoms[key]` > `options.state[key]` > the table's base atoms, and the table writes through the external atom.
- **Facets ignore their own column's filter** - `getFacetedUniqueValues`/`getFacetedMinMaxValues` facet against every OTHER active filter, so picking one sector leaves sector counts unchanged.
- **An array-valued column facets on the whole array** - the key is `["DeepTech"]`, never its elements; count per element by hand.
- **`constructTable` needs `coreReactivityFeature`** - without it, it throws a `TypeError`, and it reads `features`, not `_features`. `useTable` supplies the binding itself.

```ts
constructTable({ ...opts, features: tableFeatures({ coreReactivityFeature: storeReactivityBindings(), ...rest }) });
```

- **A leaf column's group is `Column.parent`** - reach it through `cell.getContext().column.parent` at any depth; no hand-kept label array.

## Virtualized rows and scroll containers

- **Never set an explicit `height` on a `measureElement`-tracked row** (TanStack Virtual) - the inline height blocks the ResizeObserver, so a row measured tall in one layout stays tall after the layout changes back.
- **The stock shadcn `Table` is a second scroll box** - it wraps `<table>` in `div[data-slot=table-container]` with `overflow-x-auto` and no ref or props. Under an outer scroller it becomes the sticky header's scrollport. Make that div the only scroller from the call site.
- **Reach a recipe's internal element through its `data-slot`** (shadcn) - `[&>[data-slot=table-container]]:overflow-auto` on the parent styles a div the recipe exposes no prop for.

## Copying and restyling component recipes

- **Third-party examples fork recipes** (shadcn) - TanStack's kitchen-sink `table.tsx` uses grid and flex, not native table layout. Diff against `bunx shadcn@<version> view <name>` before copying.
- **`CommandItem` hides its trailing `CheckIcon` when a `command-shortcut` slot is present** (shadcn) - render the trailing value as `CommandShortcut` and draw your own leading check.
- **A call-site `ml-auto` child in `CommandItem` shares free space** with the recipe's own `ml-auto` check, so the value floats mid-row at a different x per row.
- **`cn()` drops a class from the output string** (`tailwind-merge`) - `cn("…", "max-md:basis-1/2 max-md:flex-none")` loses the basis class, because `flex-none` also sets `flex-basis`. Run the real `cn` in isolation (`bun -e`) before reasoning about the cascade; the class may never reach the DOM.
- **Name a width once in `@theme`** (Tailwind 4) - `--container-readable: 960px` generates `max-w-readable`.

## Bar charts

- **Overlay a total behind a stack with `barGap: "-100%"`** (ECharts) - draw the unstacked total first; it shares the stacked column's `x` and `width`.
- **A hidden series leaves the value axis** - the axis rescales to what is shown. Do not pin `yAxis.max` if the chart must rescale. A rescale check needs the total to be the tallest bar.
- **Probe a chart with no browser** - `echarts.init(null, undefined, { renderer: "svg", ssr: true, width, height })` renders synchronously. Read the extent with `chart.getModel().getComponent("yAxis", 0).axis.scale.getExtent()`.
- **An `ssr: true` probe under Bun never exits** - end it with `process.exit(0)`.

## Astro

- **`store.set` with a repeated id overwrites silently** - key a Content Layer entry on a field proven unique against real data.
- **A module-level current locale crosses pages when `build.concurrency` > 1** - scope it to the render with an `AsyncLocalStorage` in middleware wrapping `next()`.
- **`getRelativeLocaleUrl` adds a trailing slash** (`/charts/`) that `Astro.url.pathname` lacks; normalize both before an active-link match.
- **`bunx astro build` runs Node** and fails on `bun:` imports; run `bun --bun astro build`.
