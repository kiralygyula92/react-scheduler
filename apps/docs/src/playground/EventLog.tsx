// SPDX-License-Identifier: MIT
// The event log (docs pack 04 §4.4): the last fifty callbacks the component invoked, with the time,
// the name and a compact rendering of the arguments. Collapsed by default, and cleared on demand.
import { useT } from '~/i18n/useT';

export interface LoggedEvent {
  readonly id: number;
  readonly time: string;
  readonly name: string;
  readonly args: string;
}

export const LOG_LIMIT = 50;

/** `{ view: 'list' }` rather than the whole item: a log line has to stay one line. */
export function summarize(args: readonly unknown[]): string {
  return args
    .map((argument) => {
      if (argument === null) return 'null';
      if (argument instanceof Date) return argument.toISOString();
      if (typeof argument !== 'object') return JSON.stringify(argument) ?? 'undefined';
      const record = argument as Record<string, unknown>;
      const id = typeof record['id'] === 'string' ? record['id'] : undefined;
      const entries = Object.entries(record)
        .map(([key, value]): [string, unknown] => [key, value instanceof Date ? value.toISOString() : value])
        .filter(([, value]) => typeof value !== 'object' && typeof value !== 'function')
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
      return id === undefined
        ? `{ ${entries.join(', ')} }`
        : `{ id: ${JSON.stringify(id)}${entries.length > 0 ? ', ' : ''}${entries.filter((entry) => !entry.startsWith('id:')).join(', ')} }`;
    })
    .join(', ');
}

export function EventLog({
  events,
  onClear,
}: {
  events: readonly LoggedEvent[];
  onClear: () => void;
}): React.ReactElement {
  const t = useT('pages/demos/playground');

  return (
    <details className="ds-pg__panel">
      <summary className="ds-pg__row ds-pg__group-summary">
        <h2 id="event-log">{t('log.title')}</h2>{' '}
        <span className="ds-pg__group-count">{t('log.count', { count: events.length })}</span>
      </summary>
      <div className="ds-pg__row">
        <button type="button" className="ds-button" onClick={onClear} disabled={events.length === 0}>
          {t('log.clear')}
        </button>
        {events.length === 0 ? (
          <p>{t('log.empty')}</p>
        ) : (
          <ol className="ds-pg__log">
            {events.map((event) => (
              <li key={event.id}>
                <code>
                  {event.time} {event.name}({event.args})
                </code>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
