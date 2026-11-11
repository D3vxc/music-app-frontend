export function Loading() {
  return (
    <div className="status">
      <span className="spinner" aria-label="Loading" />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="status">
      <h2>Couldn't load this</h2>
      <p className="muted">{message}</p>
      {onRetry && (
        <button className="btn btn-light" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="status">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
