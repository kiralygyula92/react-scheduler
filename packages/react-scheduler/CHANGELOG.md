# @react-schedulerkit/react-scheduler

## 1.0.0

### Major Changes

- e79e564: First stable release: a React component that shows a working day as shifts, in a list or on a timeline, with no runtime dependencies beyond React 18.2 or 19.

  - **Components**: `Scheduler`, which switches between the two views, and `ListView` and `TimelineView` on their own. Items are placed by start time and level, and in the default preset a short card keeps its title whole and never runs under another; the timeline caps its columns and keeps the rest behind a "+ more" chip that opens a sortable, paged table; items of a level that pins stay in view once they scroll past; two buttons move between shifts; a now indicator marks the current moment. Item detail, loading, empty and error states are built in, and the dialogs load lazily.
  - **Control**: every piece of state — date, view, open item, open overflow, header, sort, page — can be controlled or left to the component, with an event for each change, handler middleware that can cancel an interaction, and an imperative handle.
  - **Customization**: design tokens as CSS variables; `default` and `classic` presets, light, dark and system color schemes, three densities; `classNames` and `styles` per part; each of the 55 parts replaceable through `slots` and `slotProps`; render props for items, labels and states; `unstyled` with `base.css` for a look of your own.
  - **Headless**: hooks and prop getters for custom markup, `createScheduler` for any framework at `/headless`, the shift model, bucketing, layout and formatting at `/core`, and the DOM engines for pinning and navigation at `/dom`.
  - **Languages**: seven locale packs — English, and draft Spanish, Romanian, Hungarian, French, German and European Portuguese — each at `/locales/<language>`; plural rules and dates follow the pack's locale, and right-to-left layouts mirror.
  - **Server rendering** without hydration warnings on React 18 and 19, and an accessibility target of WCAG 2.2 AA, checked with axe in three browser engines.
