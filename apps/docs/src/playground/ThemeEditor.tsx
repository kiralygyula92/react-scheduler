// SPDX-License-Identifier: MIT
// The theme editor (docs pack 04 §4.7): the same shape as the Playground — controls above, the
// component below — with one control per design token, a switch for the scheme being edited, and the
// CSS for exactly what was changed.
import { useCallback, useMemo, useState } from 'react';
import { classicLevels, type ColorScheme, Scheduler } from '@react-schedulerkit/react-scheduler';
import baselineDay from '~/content/fixtures/baseline-day.json';
import { fixtureItems, fixtureMoment } from '~/demos/_shared/fixture';
import { useDemo } from '~/demos/_shared/useDemo';
import { useT } from '~/i18n/useT';
import { Code } from '~/shell/doc';
import { Stage } from './Stage';
import { asColorInput, families, stylesheet, type Token, valueOf } from './tokens';

const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];

function TokenControl({
  token,
  scheme,
  value,
  onChange,
}: {
  token: Token;
  scheme: 'light' | 'dark';
  value: string | undefined;
  onChange: (next: string) => void;
}): React.ReactElement {
  const t = useT('pages/demos/theme-editor');
  const current = value ?? valueOf(token, scheme);
  const swatch = asColorInput(current);

  return (
    <div className="ds-pg__token" data-token={token.name} data-changed={value === undefined ? undefined : ''}>
      <span className="ds-pg__token-name">{token.name}</span>
      <div className="ds-pg__token-inputs">
        {swatch !== undefined && (
          <input
            type="color"
            className="ds-pg__swatch"
            aria-label={t('tokens.color', { name: token.name })}
            value={swatch}
            onChange={(event) => {
              onChange(event.target.value);
            }}
          />
        )}
        <input
          type="text"
          className="ds-input"
          aria-label={token.name}
          value={current}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
        {value !== undefined && (
          <button
            type="button"
            className="ds-button"
            onClick={() => {
              onChange('');
            }}
          >
            {t('tokens.reset')}
          </button>
        )}
      </div>
    </div>
  );
}

export function ThemeEditor(): React.ReactElement {
  const demo = useDemo();
  const t = useT('pages/demos/theme-editor');
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');
  const [changed, setChanged] = useState<Readonly<Record<string, string>>>({});
  const [filter, setFilter] = useState('');

  const groups = useMemo(() => families(), []);
  const midnight = demo.at(0);
  const items = useMemo(
    () =>
      fixtureItems(baselineDay, midnight, {
        titles: demo.t.list('sample.titles'),
        describe: (title: string) => demo.t('sample.description', { title }),
      }),
    [demo, midnight],
  );

  const setToken = useCallback((name: string, value: string) => {
    setChanged((previous) => {
      const next = { ...previous };
      if (value === '') delete next[name];
      else next[name] = value;
      return next;
    });
  }, []);

  const css = stylesheet(changed, scheme);
  const needle = filter.trim().toLowerCase();
  const changedCount = Object.keys(changed).length;

  return (
    <div className="ds-pg">
      <div className="ds-pg__panel">
        <div className="ds-pg__row ds-pg__props-head">
          <h2 id="tokens">{t('sections.tokens')}</h2>
          <span className="ds-pg__changed">{t('tokens.changed', { count: changedCount })}</span>
          <input
            type="search"
            className="ds-input"
            placeholder={t('tokens.filter')}
            aria-label={t('tokens.filter')}
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
            }}
          />
          <fieldset className="ds-pg__field">
            <legend>{t('tokens.scheme')}</legend>
            {SCHEMES.map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="theme-editor-scheme"
                  checked={scheme === value}
                  onChange={() => {
                    setScheme(value === 'dark' ? 'dark' : 'light');
                  }}
                />
                {t(`tokens.scheme${value === 'dark' ? 'Dark' : 'Light'}`)}
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            className="ds-button"
            disabled={changedCount === 0}
            onClick={() => {
              setChanged({});
            }}
          >
            {t('tokens.resetAll')}
          </button>
        </div>

        {groups.map((family) => {
          const shown = family.tokens.filter((token) => needle === '' || token.name.includes(needle));
          if (shown.length === 0) return null;
          const count = family.tokens.filter((token) => changed[token.name] !== undefined).length;
          return (
            <details key={family.id} className="ds-pg__row" open={count > 0 || needle !== ''}>
              <summary className="ds-pg__group-summary">
                {t(`families.${family.id}`)}{' '}
                <span className="ds-pg__group-count">
                  {t('tokens.count', { count: family.tokens.length })}
                  {count > 0 ? ` · ${t('tokens.changed', { count })}` : ''}
                </span>
              </summary>
              <div className="ds-pg__tokens">
                {shown.map((token) => (
                  <TokenControl
                    key={token.name}
                    token={token}
                    scheme={scheme}
                    value={changed[token.name]}
                    onChange={(next) => {
                      setToken(token.name, next);
                    }}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <Stage message={t('stage.error')}>
        <Scheduler
          items={items}
          levels={classicLevels}
          shifts={{ durationHours: baselineDay.shiftHours, anchor: '8:00', before: 0, after: 1 }}
          date={fixtureMoment(baselineDay, midnight, 'date')}
          now={fixtureMoment(baselineDay, midnight, 'now')}
          colorScheme={scheme}
          localization={demo.localization}
          tokens={changed}
        />
      </Stage>

      <div>
        <h2 id="css">{t('sections.css')}</h2>
        <p>{css === '' ? t('css.empty') : t('css.intro')}</p>
        {css !== '' && <Code lang="css">{css}</Code>}
      </div>
    </div>
  );
}
