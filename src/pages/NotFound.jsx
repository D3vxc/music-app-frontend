import { Link } from 'react-router';
export default function NotFound() {
  return (
    <div className="page center-page">
      <h1>Page not found</h1>
      <p className="muted">That page skipped a beat.</p>
      <Link to="/" className="btn btn-primary">Back home</Link>
    </div>
  );
}
