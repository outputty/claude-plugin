---
name: frontend
description: "Lists frontend traps and their fixes - React state and URL sync under rapid input, TanStack Table v9 state, facets and virtualized rows, shadcn recipes (Table scroll, Command items), Tailwind class merging with cn(), ECharts bar charts and SSR probes, hydration mismatches, Astro islands and i18n. Use when a URL freezes during a drag, React #418 or a hydration mismatch appears, a cn() class goes missing, or a TanStack table, shadcn recipe, ECharts chart or Astro island misbehaves."
---

# frontend

## Browser history

### Do

- Debounce `history.replaceState` and `history.pushState`.
- Test the rate limit with a real, sustained gesture.
- Count renders with `console.count()` at the call site.

### Don't

- Don't throttle `history.replaceState` or `history.pushState`.
- Don't test the rate limit with a scripted `replaceState` burst.
- Don't count renders with `requestAnimationFrame` or Event Timing.

## React

### Do

- Memoize the option and the handlers when state feeds both `setOption` and `dispatchAction`, keyed on everything except the hover state in an ECharts chart.
- List the methods of `useTable()` in effect deps in a TanStack Table v9 effect.

### Don't

- Don't wrap a heavy consumer of a shared selection in `useDeferredValue`.
- Don't list `useTable()`'s return value in effect deps (TanStack Table v9).

## Hydration

### Do

- Seed an island's first render with build-time props through `useSyncExternalStore`'s `getServerSnapshot` in an Astro island.
- Pass a serializable key to an island and pick the function inside the component.

### Don't

- Don't read state another island fills on mount in an island's first render.
- Don't pass a function as a prop to an island.
- Don't render a live `useSelector` value during hydration.

## TanStack Table v9

### Do

- Expect precedence `options.atoms[key]`, then `options.state[key]`, then the table's base atoms; the table writes through the external atom.
- Count per element by hand for an array-valued column.
- Pass `coreReactivityFeature: storeReactivityBindings()` inside `tableFeatures({...})` to `constructTable`'s `features`; `useTable` supplies it itself.
- Reach a leaf column's group through `cell.getContext().column.parent`.

### Don't

- Don't expect a facet to count against its own column's filter.
- Don't facet an array-valued column and expect its elements.
- Don't read `_features` from `constructTable`.
- Don't keep a hand-made label array for column groups.

## TanStack Virtual and shadcn Table

### Do

- Make the `data-slot=table-container` div the only scroller, styled from the parent: `[&>[data-slot=table-container]]:overflow-auto`.

### Don't

- Don't set an explicit `height` on a `measureElement`-tracked row.
- Don't leave the stock `Table`'s container as a second scroll box under an outer scroller.

## shadcn recipes

### Do

- Diff a third-party example against `bunx shadcn@<version> view <name>` before copying it.
- Render a `CommandItem`'s trailing value as `CommandShortcut` and draw your own leading check.

### Don't

- Don't copy TanStack's kitchen-sink `table.tsx` as a shadcn recipe.
- Don't put an `ml-auto` child in a `CommandItem`.

## Tailwind class merging

### Do

- Run the real `cn` in isolation, `bun -e`, before reasoning about the cascade.
- Write the classes `cn` must keep so that none shares a property with another: `flex-none` and `basis-*` both set `flex-basis`.

### Don't

- Don't assume `cn()` keeps both of two classes that set the same property.

## ECharts

### Do

- Draw the unstacked total first and set `barGap: "-100%"` to overlay it behind a stack.
- Leave `yAxis.max` unset when the chart must rescale.
- Make the total the tallest bar in a rescale check.
- Probe a chart with `echarts.init(null, undefined, { renderer: "svg", ssr: true, width, height })`.
- Read the extent with `chart.getModel().getComponent("yAxis", 0).axis.scale.getExtent()`.
- End an `ssr: true` probe under Bun with `process.exit(0)`.

### Don't

- Don't pin `yAxis.max` on a chart that rescales.

## Astro

### Do

- Key a Content Layer entry on a field proven unique against real data.
- Scope the current locale to the render with an `AsyncLocalStorage` in middleware wrapping `next()`.
- Normalize `getRelativeLocaleUrl` and `Astro.url.pathname` before an active-link match.
- Build with `bun --bun astro build`.

### Don't

- Don't call `store.set` with an id that may repeat.
- Don't keep the current locale in a module-level variable.
- Don't run `bunx astro build` when the project imports `bun:` modules.

## Glossary

- **Atom** - one unit of state in a store library.
- **External atom** - an atom the app creates and hands to the table, instead of the table's own.
- **Facet** - a count or range of a column's values, computed against the other columns' filters.
- **Island** - an Astro component that hydrates on its own in the browser.
- **Recipe** - a component's source as shadcn copies it into the repo.
- **Scrollport** - the box a sticky element sticks within.
- **Content Layer** - Astro's store of content entries, filled by a loader.
- **React #418** - React's hydration-mismatch error: the server HTML differs from the client's first render.
