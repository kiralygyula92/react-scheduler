// SPDX-License-Identifier: MIT
// A key name. Key labels are glyphs and product-fixed names, not prose, so they are passed in
// rather than translated (docs pack 02 §6.8).
export function Kbd({ children }: { children: string }): React.ReactElement {
  return <kbd>{children}</kbd>;
}
