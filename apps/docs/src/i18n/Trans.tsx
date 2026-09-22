// SPDX-License-Identifier: MIT
// Renders a message that carries inline markup (docs pack 11 §9). Six tags are allowed and nothing
// else: a locale file can emphasize, show code or link, but it can never introduce structure or an
// attribute the shell does not control. An unknown tag throws, so a bad translation fails the build
// and the i18n check rather than reaching a reader.
import { Fragment } from 'react';
import { Link } from 'react-router';
import type { Vars } from './format';
import { useI18n } from './I18nProvider';
import { buildPath } from './paths';
import { useT } from './useT';
import { site } from '~/shell/nav';

const TAGS = ['strong', 'em', 'code', 'kbd', 'link', 'ext'] as const;
type Tag = (typeof TAGS)[number];

interface Token {
  readonly tag?: Tag;
  readonly attribute?: string;
  readonly text: string;
}

const PATTERN = /<(\w+)(?:\s+(?:to|href)="([^"]*)")?>([\s\S]*?)<\/\1>/g;

/** Splits a formatted message into plain text and single-level tagged runs. */
export function tokenize(message: string): readonly Token[] {
  const tokens: Token[] = [];
  let index = 0;
  for (const match of message.matchAll(PATTERN)) {
    const [whole, name, attribute, text] = match;
    if (!TAGS.includes(name as Tag)) throw new Error(`Message uses the tag <${String(name)}>, which is not allowed`);
    const tag = name as Tag;
    if ((tag === 'link' || tag === 'ext') && attribute === undefined) {
      throw new Error(`<${tag}> needs a ${tag === 'link' ? 'to' : 'href'} attribute: ${message}`);
    }
    if (match.index > index) tokens.push({ text: message.slice(index, match.index) });
    tokens.push({ tag, ...(attribute !== undefined && { attribute }), text: text ?? '' });
    index = match.index + whole.length;
  }
  const remainder = message.slice(index);
  if (remainder !== '') tokens.push({ text: remainder });
  const stray = tokens.find((token) => token.tag === undefined && /<\w+[\s>]/.test(token.text));
  if (stray !== undefined) throw new Error(`Message has markup that is not an allowed inline tag: ${message}`);
  return tokens;
}

export function Trans({ k, ns = 'common', vars }: { k: string; ns?: string; vars?: Vars }): React.ReactElement {
  const { locale } = useI18n();
  const t = useT(ns);
  const external = useT('common')('shell.externalLink');
  return (
    <>
      {tokenize(t(k, vars)).map((token, index) => {
        const key = `${String(index)}-${token.tag ?? ''}`;
        switch (token.tag) {
          case undefined:
            return <Fragment key={key}>{token.text}</Fragment>;
          case 'strong':
            return <strong key={key}>{token.text}</strong>;
          case 'em':
            return <em key={key}>{token.text}</em>;
          case 'code':
            return <code key={key}>{token.text}</code>;
          case 'kbd':
            return <kbd key={key}>{token.text}</kbd>;
          case 'link':
            return (
              <Link key={key} to={buildPath(locale, token.attribute ?? '/', site.pluginId)}>
                {token.text}
              </Link>
            );
          case 'ext': {
            // The shell has no visually hidden utility class, so the marker rides on the name.
            const label = `${token.text} ${external}`;
            return (
              <a key={key} href={token.attribute} target="_blank" rel="noreferrer" aria-label={label}>
                {token.text}
              </a>
            );
          }
        }
      })}
    </>
  );
}
