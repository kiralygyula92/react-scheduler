// SPDX-License-Identifier: MIT
// The component area of the Playground and of the theme editor (docs pack 04 §4.3): a framed box
// that renders the live component and, when a combination of props is one the component refuses,
// a themed message instead of a blank page.
import { Component, type ReactNode } from 'react';

export class Stage extends Component<{ message: string; children: ReactNode }, { failed: boolean; key: number }> {
  override state = { failed: false, key: 0 };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  /** A new set of props is a new attempt: the box recovers instead of staying broken. */
  override componentDidUpdate(previous: { children: ReactNode }): void {
    if (this.state.failed && previous.children !== this.props.children) {
      this.setState((state) => ({ failed: false, key: state.key + 1 }));
    }
  }

  override render(): ReactNode {
    return (
      <div className="ds-pg__component">
        {this.state.failed ? <p className="ds-lead">{this.props.message}</p> : this.props.children}
      </div>
    );
  }
}
