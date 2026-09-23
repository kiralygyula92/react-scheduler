// SPDX-License-Identifier: MIT
// Changelog (T15, docs pack 03 §3.15): generated at build time from the package's own CHANGELOG.md,
// which Changesets writes. The frame is translated; the entries are not, because they are published
// in English on npm and a translated copy would drift from them.
import changelog from '~/content/changelog.json';
import { Callout, Inline, P, Page, Section } from '~/shell/doc';

const NS = 'pages/discover-more/changelog';

/** One release as `scripts/lib/changelog.ts` writes it; the file is empty until the first release. */
interface Release {
  readonly version: string;
  readonly groups: readonly { readonly title: string; readonly entries: readonly string[] }[];
}

export default function Changelog(): React.ReactElement {
  const releases = changelog.releases as readonly Release[];

  return (
    <Page ns={NS}>
      <P k="intro" ns={NS} />
      <Callout tone="info" titleKey="english.title" k="english.text" ns={NS} />

      {releases.length === 0 ? (
        <Section id="unreleased" ns={NS} titleKey="sections.unreleased">
          <P k="unreleased.text" ns={NS} />
        </Section>
      ) : (
        releases.map((release) => (
          <Section key={release.version} id={`v${release.version}`} ns={NS} titleKey="" title={release.version}>
            {release.groups.map((group) => (
              <section key={`${release.version}-${group.title}`}>
                {group.title === '' ? null : <h3>{group.title}</h3>}
                <ul>
                  {group.entries.map((entry) => (
                    <li key={entry}>
                      <Inline text={entry} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </Section>
        ))
      )}

      <Section id="how-to-read-it" ns={NS} titleKey="sections.how-to-read-it">
        <P k="how.text" ns={NS} />
      </Section>
    </Page>
  );
}
