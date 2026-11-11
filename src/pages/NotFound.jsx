import { Link } from "react-router-dom";
import { Empty } from "../components/Status";

export default function NotFound() {
  return (
    <Empty title="Page not found">
      <p className="muted">We can't seem to find the page you're looking for.</p>
      <Link className="btn btn-light" to="/">
        Home
      </Link>
    </Empty>
  );
}
