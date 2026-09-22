# 11 — Open questions

Items that were not decided during extraction. Each has a proposed default that the new repository may
use until the question is answered.

| # | Question | Proposed default | Owner |
|---|---|---|---|
| Q-01 | **Final package name.** The working name `react-scheduler` is already taken on the public registry (a commercial-licence package). Which scope or name? | Publish as `@<scope>/react-scheduler`; keep the display name "React Scheduler" | maintainer |
| Q-02 | **Native review** of the `roRO`, `huHU`, `frFR`, `deDE` and `ptPT` packs and the new `esES` keys (all drafted during extraction). | Ship them marked "community review welcome" until reviewed | maintainer + translators |
| Q-03 | "+more" chip text: the source showed "More" but also had an unused "+{{count}}" template. Show the count visibly? | Keep "More" visibly (parity); the count goes in `more.ariaLabel` | design |
| Q-04 | Default `colorScheme`: `'light'` or `'system'`? | `'light'` (predictable for embedding apps) | maintainer |
| Q-05 | B-23 and B-24 were inferred from the implementation, not observed. Keep them as bugs? | Keep; both fixes are harmless | maintainer |
| Q-06 | Carried-over count with `before > 1`: count items from **all** earlier shifts, or only offset −1? | All earlier rendered shifts (05 F-08) | design |
| Q-07 | `overflowMergeWindow` default of 2 h — is that the right grouping span for users? | 2 h; revisit after the demo `overflow-window` | design |
| Q-08 | Compact hour labels outside English: keep `Intl` output (e.g. "8 Uhr") or force digits only? | `Intl` output, with a space before a day-period marker removed (05 F-12) | design |
| Q-09 | Should `classic` fix the invisible dark-scheme focus ring (an accessibility failure) at the cost of exact parity? | No, for exact parity; document it and recommend `default` | maintainer |
| Q-10 | `listOnlyBreakpoint` uses container width. The source's consumer used the viewport width. Acceptable? | Container width (equal to the viewport for full-width layouts) | maintainer |
| Q-11 | Should `timeZone` (F-45) move to v1.0? | v1.x; v1.0 uses the local zone | maintainer |
| Q-12 | Font guidance for `classic`: the named families are not bundled. Document how to load them? | A docs note with links to the OFL sources | docs |
| Q-13 | Browser floor: Safari 16.4 (for the `<dialog>` and observer behaviour relied on). | Keep 16.4 | maintainer |
| Q-14 | Visual tolerance of 0.1 % of pixels: confirm with the first CI runs across font rasterisers. | 0.1 % on Chromium; may relax to 0.3 % on WebKit and Firefox | maintainer |
| Q-15 | Overflow table time column header: parity text "Observed at". Rename to a neutral "Time" in the `default` preset's locale? | Keep the parity text; consumers localize | design |
| Q-16 | `durationHours` must divide 24. Support rotating schedules (e.g. 10 h shifts that drift across days)? | Not in v1.0; use `pattern` for irregular days | design |
| Q-17 | Default detail dialog content: is title, description, pills, time and suggestion enough, or should it expose extra fields from `data`? | Enough; `renderItemDetail` covers the rest | design |
