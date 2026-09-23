// SPDX-License-Identifier: MIT
// The drawer below 900px (docs pack 02 §6.4, O10): the same sidebar, in a modal that closes on a
// route change, on Esc, on a backdrop click and on the hamburger, traps focus while open and gives
// focus back to the hamburger when it closes.
import { useT } from '~/i18n/useT';
import { useBodyScrollLock, useCloseOnRouteChange, useEscape, useFocusTrap } from './hooks';
import { Sidebar } from './Sidebar';

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }): React.ReactElement {
  const t = useT('common');
  useCloseOnRouteChange(onClose);
  useEscape(open, onClose);
  useBodyScrollLock(open);
  const drawer = useFocusTrap<HTMLDivElement>(open);

  return (
    <>
      {open && <div className="ds-drawer-backdrop" onClick={onClose} aria-hidden="true" />}
      <div
        id="ds-drawer"
        ref={drawer}
        className="ds-drawer"
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label={t('shell.sidebarLabel')}
      >
        <Sidebar />
      </div>
    </>
  );
}
