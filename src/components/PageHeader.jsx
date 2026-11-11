import { hue } from "../utils/format";

/** Big gradient header used by playlist, artist and liked-songs pages. */
export default function PageHeader({ seed, color, art, type, title, children }) {
  const h = hue(seed || title);
  const bg = color || `hsl(${h} 45% 35%)`;
  return (
    <div className="page-header" style={{ "--header": bg }}>
      {art && <div className="header-art">{art}</div>}
      <div className="header-text">
        {type && <span className="header-type">{type}</span>}
        <h1 className={title.length > 24 ? "long" : ""}>{title}</h1>
        <div className="header-meta">{children}</div>
      </div>
    </div>
  );
}
