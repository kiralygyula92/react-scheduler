// SPDX-License-Identifier: MIT
// The controls above a demo's schedule, drawn with the site's own classes (`.ds-button`, `.ds-check`)
// so every demo looks like the rest of the site. A choice among a few values is a group of toggle
// buttons: the chosen one is pressed (`aria-pressed`) and filled, and the visible label names the
// group. Layout only is set here; colours and sizes come from the shell.
import { type ReactNode, useId } from 'react';

const ROW = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--ds-space-3) var(--ds-space-5)',
  marginBottom: 'var(--ds-space-4)',
} as const;
const GROUP = { display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ds-space-2)' } as const;
const LABEL = {
  marginInlineEnd: 'var(--ds-space-1)',
  fontSize: 'var(--ds-fs-sm)',
  color: 'var(--ds-text-secondary)',
} as const;

/** A row of controls above the schedule. */
export function Controls({ children }: { children: ReactNode }): React.ReactElement {
  return <div style={ROW}>{children}</div>;
}

/** One value out of a few, as toggle buttons. */
export function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}): React.ReactElement {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} style={GROUP}>
      <span id={id} style={LABEL}>
        {label}
      </span>
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            className="ds-button"
            aria-pressed={pressed}
            data-variant={pressed ? 'primary' : undefined}
            onClick={() => {
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** A setting that is on or off. */
export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}): React.ReactElement {
  return (
    <label className="ds-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      {label}
    </label>
  );
}
