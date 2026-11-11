import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Lightweight popover menu anchored to a point or element.
 * items: [{ label, icon, onClick, danger, divider, submenu: items[] }]
 */
export default function Menu({ anchor, items, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const [sub, setSub] = useState(null);

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const rect = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor;
    const m = ref.current.getBoundingClientRect();
    let left = (rect.right ?? rect.left) - m.width;
    let top = (rect.bottom ?? rect.top) + 4;
    if (left < 8) left = 8;
    if (left + m.width > window.innerWidth - 8) left = window.innerWidth - m.width - 8;
    if (top + m.height > window.innerHeight - 8) top = Math.max(8, (rect.top ?? top) - m.height - 4);
    setPos({ top, left });
  }, [anchor, sub]);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    const onScroll = () => onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
    };
  }, [onClose]);

  const list = sub ? sub.items : items;

  return createPortal(
    <div className="menu" ref={ref} style={pos} role="menu">
      {sub && (
        <button className="menu-item menu-back" onClick={() => setSub(null)}>
          ‹ {sub.label}
        </button>
      )}
      {list.map((item, i) =>
        item.divider ? (
          <div key={`d${i}`} className="menu-divider" />
        ) : (
          <button
            key={item.label + i}
            role="menuitem"
            className={`menu-item ${item.danger ? "danger" : ""}`}
            disabled={item.disabled}
            onClick={() => {
              if (item.submenu) return setSub({ label: item.label, items: item.submenu });
              item.onClick?.();
              onClose();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.submenu && <span className="menu-caret">›</span>}
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}
