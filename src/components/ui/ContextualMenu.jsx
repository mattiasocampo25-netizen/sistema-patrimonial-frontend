import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ContextMenuContext = createContext(null);
const INTERACTIVE = 'button, a, input, textarea, select, [contenteditable="true"], [role="button"]';

export function ContextMenuButton({ actions, label = 'Más acciones', title = 'Más acciones', className = '' }) {
  const openMenu = useContext(ContextMenuContext);
  return <button type="button" title={title} aria-label={title} aria-haspopup="menu" onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); openMenu?.(actions, rect.left, rect.bottom + 4, label); }} className={className}><i className="fa-solid fa-ellipsis" aria-hidden="true" /></button>;
}

export function ContextualMenuProvider({ children }) {
  const [menu, setMenu] = useState(null);
  const menuRef = useRef(null);
  menuRef.current = menu;

  const close = useCallback(() => setMenu(null), []);
  const open = useCallback((actions, x, y, label = 'Acciones') => {
    const available = actions.filter(action => action && typeof action.onSelect === 'function');
    if (available.length) setMenu({ actions: available, x, y, label });
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    const dismiss = event => {
      if (event.type === 'keydown' && event.key === 'Escape') close();
      if (event.type === 'pointerdown' && !event.target.closest('[data-contextual-menu]')) close();
      if (event.type === 'scroll') close();
    };
    window.addEventListener('keydown', dismiss);
    window.addEventListener('pointerdown', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [menu, close]);

  return (
    <ContextMenuContext.Provider value={open}>
      {children}
      {menu && typeof document !== 'undefined' && createPortal(
        <div
          data-contextual-menu
          role="menu"
          aria-label={menu.label}
          className="fixed z-[1000] min-w-52 max-w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-line bg-surface-1 p-1.5 text-content-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
          style={{ left: Math.max(8, Math.min(menu.x, window.innerWidth - 280)), top: Math.max(8, Math.min(menu.y, window.innerHeight - (menu.actions.length * 40 + 24))) }}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-extrabold uppercase tracking-wider text-content-3">{menu.label}</p>
          {menu.actions.map((action, index) => (
            <React.Fragment key={`${action.label}-${index}`}>
              {action.separator && <div className="my-1 border-t border-line" />}
              <button
                type="button"
                role="menuitem"
                autoFocus={index === 0}
                onClick={() => { close(); action.onSelect(); }}
                className={`flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${action.danger ? 'text-danger hover:bg-danger-soft' : 'text-content-1 hover:bg-surface-2'}`}
              >
                {action.icon && <i className={`fa-solid ${action.icon} w-4 text-center text-[11px] text-content-2`} aria-hidden="true" />}
                <span>{action.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>,
        document.body
      )}
    </ContextMenuContext.Provider>
  );
}

/** Adds right-click, Shift+F10 and touch long-press without wrapping table markup. */
export function ContextMenuTarget({ as: Element = 'div', actions, label = 'Acciones del registro', children, onContextMenu, onKeyDown, onPointerDown, onPointerUp, onPointerCancel, ...props }) {
  const openMenu = useContext(ContextMenuContext);
  const timer = useRef(null);
  const longPressed = useRef(false);
  const clearTimer = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <Element
      {...props}
      data-context-actions="true"
      tabIndex={props.tabIndex ?? 0}
      aria-label={props['aria-label'] || `${label}. Clic derecho o mantén pulsado para ver opciones.`}
      onContextMenu={event => {
        onContextMenu?.(event);
        if (event.defaultPrevented || !openMenu) return;
        event.stopPropagation();
        event.preventDefault();
        if (longPressed.current) { longPressed.current = false; return; }
        if (event.target.closest(INTERACTIVE)) return;
        openMenu(actions, event.clientX, event.clientY, label);
      }}
      onKeyDown={event => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) && openMenu) {
          event.stopPropagation();
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          openMenu(actions, rect.left + Math.min(rect.width / 2, 160), rect.top + Math.min(rect.height / 2, 24), label);
        }
      }}
      onPointerDown={event => {
        onPointerDown?.(event);
        if (event.defaultPrevented || event.pointerType !== 'touch' || !openMenu) return;
        if (event.target.closest(INTERACTIVE)) { event.stopPropagation(); return; }
        event.stopPropagation();
        clearTimer();
        timer.current = window.setTimeout(() => {
          longPressed.current = true;
          openMenu(actions, event.clientX, event.clientY, label);
        }, 550);
      }}
      onPointerUp={event => { clearTimer(); onPointerUp?.(event); }}
      onPointerCancel={event => { clearTimer(); onPointerCancel?.(event); }}
      onPointerLeave={clearTimer}
    >
      {children}
    </Element>
  );
}
