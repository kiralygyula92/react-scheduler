// SPDX-License-Identifier: MIT
// The controls panel (docs pack 04 §4.1–§4.2): the scenario above, then every prop of the component
// grouped by its `@category`, then the props only code can set. Each row carries `data-prop`, which
// is what conformance C7 counts, so a prop cannot quietly disappear from this page.
import { useId } from 'react';
import { useT } from '~/i18n/useT';
import { Inline } from '~/shell/doc';
import { type Control, type ControlGroup, defaultLabel } from './model';

export interface SetupField {
  readonly name: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly value: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

function PropControl({
  control,
  value,
  onChange,
}: {
  control: Control;
  value: string | undefined;
  onChange: (next: string) => void;
}): React.ReactElement {
  const t = useT('pages/demos/playground');
  const id = useId();
  const current = value ?? '';
  const label = `${control.prop.name}, ${control.prop.type}`;

  if (control.kind === 'number') {
    return (
      <>
        {control.slider && (
          <input
            type="range"
            aria-label={label}
            className="ds-pg__range"
            min={control.prop.min}
            max={control.prop.max}
            step={control.prop.step ?? 1}
            value={current === '' ? String(control.prop.min ?? 0) : current}
            onChange={(event) => {
              onChange(event.target.value);
            }}
          />
        )}
        <input
          type="number"
          id={id}
          aria-label={control.slider ? label : undefined}
          className="ds-input"
          min={control.prop.min}
          max={control.prop.max}
          step={control.prop.step ?? 1}
          placeholder={defaultLabel(control.prop)}
          value={current}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      </>
    );
  }

  if (control.kind === 'text') {
    return (
      <input
        type="text"
        aria-label={label}
        className="ds-input"
        placeholder={defaultLabel(control.prop)}
        value={current}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    );
  }

  return (
    <select
      aria-label={label}
      className="ds-select"
      value={current}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      <option value="">{t('props.defaultOption', { value: defaultLabel(control.prop) })}</option>
      {control.options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Card({
  control,
  value,
  onChange,
}: {
  control: Control;
  value: string | undefined;
  onChange: (next: string) => void;
}): React.ReactElement {
  const t = useT('pages/demos/playground');
  const api = useT('api');
  const changed = value !== undefined;

  return (
    <div className="ds-pg__card" data-prop={control.prop.name} data-changed={changed ? '' : undefined}>
      <div className="ds-pg__card-head">
        <span className="ds-pg__prop">{control.prop.name}</span>
        {changed && (
          <button
            type="button"
            className="ds-button"
            onClick={() => {
              onChange('');
            }}
          >
            {t('props.reset')}
          </button>
        )}
      </div>
      <PropControl control={control} value={value} onChange={onChange} />
      <span className="ds-pg__type">{control.prop.type}</span>
      <p className="ds-pg__help">
        <Inline text={api(control.prop.descriptionKey)} />
      </p>
    </div>
  );
}

/** The props no control can express, and the callbacks the log takes care of (04 §4.2). */
function Listed({
  id,
  titleKey,
  controls,
}: {
  id: string;
  titleKey: string;
  controls: readonly Control[];
}): React.ReactElement {
  const t = useT('pages/demos/playground');
  const api = useT('api');

  return (
    <details className="ds-pg__row" id={id}>
      <summary className="ds-pg__group-summary">
        {t(titleKey)} <span className="ds-pg__group-count">{t('props.count', { count: controls.length })}</span>
      </summary>
      <ul className="ds-pg__listed">
        {controls.map((control) => (
          <li key={control.prop.name} data-prop={control.prop.name}>
            <code className="ds-pg__prop">{control.prop.name}</code>{' '}
            <span className="ds-pg__type">{control.prop.type}</span> <Inline text={api(control.prop.descriptionKey)} />
          </li>
        ))}
      </ul>
    </details>
  );
}

export function Controls({
  groups,
  listed,
  events,
  values,
  setup,
  filter,
  changedOnly,
  onProp,
  onSetup,
  onFilter,
  onChangedOnly,
  onResetAll,
  total,
}: {
  groups: readonly ControlGroup[];
  listed: readonly Control[];
  events: readonly Control[];
  values: Readonly<Record<string, string>>;
  setup: readonly SetupField[];
  filter: string;
  changedOnly: boolean;
  onProp: (name: string, value: string) => void;
  onSetup: (name: string, value: string) => void;
  onFilter: (value: string) => void;
  onChangedOnly: (value: boolean) => void;
  onResetAll: () => void;
  total: number;
}): React.ReactElement {
  const t = useT('pages/demos/playground');
  const api = useT('api');
  const changedCount = Object.keys(values).length;
  const needle = filter.trim().toLowerCase();

  const matches = (control: Control): boolean => {
    if (changedOnly && values[control.prop.name] === undefined) return false;
    if (needle === '') return true;
    return (
      control.prop.name.toLowerCase().includes(needle) ||
      api(control.prop.descriptionKey).toLowerCase().includes(needle)
    );
  };

  return (
    <div className="ds-pg__panel">
      <div className="ds-pg__row">
        <button type="button" className="ds-button" onClick={onResetAll} disabled={changedCount === 0}>
          {t('controls.resetAll')}
        </button>
      </div>

      <details className="ds-pg__row" open>
        <summary className="ds-pg__group-summary">
          <h2 id="setup">{t('sections.setup')}</h2>
        </summary>
        <div className="ds-pg__setup">
          {setup.map((field) => (
            <label key={field.name} className="ds-pg__field">
              {t(`setup.${field.name}`)}
              {field.options.length > 0 ? (
                <select
                  className="ds-select"
                  value={field.value}
                  onChange={(event) => {
                    onSetup(field.name, event.target.value);
                  }}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  className="ds-input"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={field.value}
                  onChange={(event) => {
                    onSetup(field.name, event.target.value);
                  }}
                />
              )}
            </label>
          ))}
        </div>
      </details>

      <div className="ds-pg__row ds-pg__props-head">
        <h2 id="props">{t('props.title', { count: total })}</h2>
        <span className="ds-pg__changed">{t('props.changed', { count: changedCount })}</span>
        <input
          type="search"
          className="ds-input"
          placeholder={t('props.filter')}
          aria-label={t('props.filter')}
          value={filter}
          onChange={(event) => {
            onFilter(event.target.value);
          }}
        />
        <label className="ds-pg__field">
          <input
            type="checkbox"
            checked={changedOnly}
            onChange={(event) => {
              onChangedOnly(event.target.checked);
            }}
          />
          {t('props.changedOnly')}
        </label>
      </div>

      {groups.map((group, index) => {
        const shown = group.controls.filter((control) => matches(control));
        const changed = group.controls.filter((control) => values[control.prop.name] !== undefined).length;
        if (shown.length === 0) return null;
        // The first group is open so the panel shows at a glance what it holds; the others open when
        // one of their props has been changed, or when a filter has already narrowed the list.
        return (
          <details
            key={group.category}
            className="ds-pg__row"
            open={index === 0 || changed > 0 || needle !== '' || changedOnly}
          >
            <summary className="ds-pg__group-summary">
              {group.category}{' '}
              <span className="ds-pg__group-count">
                {t('props.count', { count: group.controls.length })}
                {changed > 0 ? ` · ${t('props.changed', { count: changed })}` : ''}
              </span>
            </summary>
            <div className="ds-pg__cards">
              {shown.map((control) => (
                <Card
                  key={control.prop.name}
                  control={control}
                  value={values[control.prop.name]}
                  onChange={(next) => {
                    onProp(control.prop.name, next);
                  }}
                />
              ))}
            </div>
          </details>
        );
      })}

      <Listed id="events" titleKey="props.eventsTitle" controls={events} />
      <Listed id="code-only" titleKey="props.codeOnlyTitle" controls={listed} />
    </div>
  );
}
