import { useState } from "react";

/** Range input that fills to the current value and only commits on release while dragging. */
export default function Slider({ value, max, onChange, onCommit, label, className = "" }) {
  const [drag, setDrag] = useState(null);
  const shown = drag ?? value;
  const pct = max > 0 ? Math.min(100, (shown / max) * 100) : 0;
  return (
    <input
      type="range"
      className={`slider ${className}`}
      min={0}
      max={max || 0}
      step="any"
      value={max ? shown : 0}
      aria-label={label}
      style={{ "--pct": `${pct}%` }}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (onCommit) setDrag(v);
        onChange?.(v);
      }}
      onPointerUp={() => {
        if (drag !== null) onCommit?.(drag);
        setDrag(null);
      }}
      onKeyUp={() => {
        if (drag !== null) onCommit?.(drag);
        setDrag(null);
      }}
    />
  );
}
