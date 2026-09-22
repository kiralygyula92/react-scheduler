# Fixtures

Generated, copyright-free data. All titles are invented; all dates are in 2031 and are **local wall-clock** times (no offset).
Parity runs MUST use the time zone `UTC` and the locale `en-US` unless a scenario says otherwise.

| Field | Meaning |
|---|---|
| `selectedDate` | The focused instant; decides which shift is "current". |
| `now` | Wall clock used for the now indicator. |
| `shiftHours`, `anchorHour` | Shift length and the hour one shift boundary falls on (parity: 12 and 8). |
| `userRole` | Consumer role flag; has no observable effect (see bug list). |
| `items[].level` | One of the 9 classic levels, ordered by rank: critical, watch, monitoring, capacityWatch, ready, normal, onTarget, routine, resolved. |
| `items[].end` | Optional; missing means start + 2 h. |
| `items[].detail` | `critical` → time label "Observed at: {observedLabel}"; `standard` → "Ready since: {since}" (formatted) or the time range. |
| `items[].tags` | `impactsNextShift`, `carriedOver`. |
| `items[].reference` | Optional reference number shown as a pill ("{referenceLabel} 1042"). |

- `baseline-day.json` — Day shift with items in all three shifts, one crowded hour, pinned-level items in previous and current shift. (17 items)
- `empty.json` — No items at all. (0 items)
- `sparse.json` — One item per shift (navigation threshold not reached). (3 items)
- `crowded.json` — Seven overlapping items around 09:00–11:30 plus one isolated item (column cap, promotion, overflow buckets). (8 items)
- `night-shift.json` — Selected time 02:00 → current shift is the night shift that started 20:00 the previous day. (17 items)
- `past-date.json` — Selected date two days before now (no now indicator). (17 items)
- `pinned-many.json` — Six pinned-level items in the previous shift, six routine items in the current shift. (12 items)
- `large.json` — 240 generated items across the 36 h range (performance). (240 items)
