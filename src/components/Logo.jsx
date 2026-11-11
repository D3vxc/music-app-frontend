import { Link } from "react-router-dom";
import { APP_NAME } from "../config";

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label={`${APP_NAME} home`}>
      <img src="/logo.svg" alt="" width="32" height="32" />
      <span>{APP_NAME}</span>
    </Link>
  );
}
