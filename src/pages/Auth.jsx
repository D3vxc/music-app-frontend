import { forwardRef, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../api";
import { artistSchema, listenerSchema, loginSchema } from "../validation";
import { APP_NAME } from "../config";

// forwardRef so react-hook-form's register() can reach the real input.
const Field = forwardRef(function Field({ label, error, as, ...props }, ref) {
  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      {as === "textarea" ? <textarea rows={3} ref={ref} {...props} /> : <input ref={ref} {...props} />}
      {error && <small className="field-error">{error.message}</small>}
    </label>
  );
});

function AuthShell({ title, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-top">
        <Logo />
      </div>
      <div className="auth-card">
        <h1>{title}</h1>
        {children}
        <div className="auth-footer">{footer}</div>
      </div>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  // Redirect via state (not navigate()) so it renders in the same pass as the new user.
  const [redirect, setRedirect] = useState(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(loginSchema) });

  if (redirect) return <Navigate to={redirect} replace />;
  if (user) return <Navigate to="/" replace />;

  const onSubmit = handleSubmit(async (data) => {
    setServerError("");
    try {
      const account = await login(data);
      toast(`Welcome back, ${account.name.split(" ")[0]}`);
      setRedirect(location.state?.from || (account.role === "artist" ? "/studio" : "/"));
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  return (
    <AuthShell
      title={`Log in to ${APP_NAME}`}
      footer={
        <>
          Don't have an account? <Link to="/register">Sign up</Link>
        </>
      }
    >
      {serverError && <div className="form-alert">{serverError}</div>}
      <form className="form" onSubmit={onSubmit} noValidate>
        <Field label="Email or username" autoComplete="username" autoFocus error={formState.errors.identifier} {...register("identifier")} />
        <Field label="Password" type="password" autoComplete="current-password" error={formState.errors.password} {...register("password")} />
        <button className="btn btn-accent btn-block" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { user, register: signUp } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const asArtist = params.get("artist") === "1";
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(asArtist ? artistSchema : listenerSchema),
  });

  const [redirect, setRedirect] = useState(null);

  if (redirect) return <Navigate to={redirect} replace />;
  if (user) return <Navigate to="/" replace />;

  const onSubmit = handleSubmit(async (data) => {
    setServerError("");
    try {
      const account = await signUp(data, asArtist);
      toast(`Welcome to ${APP_NAME}, ${account.name.split(" ")[0]}!`);
      setRedirect(asArtist ? "/studio" : "/");
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  const { errors } = formState;

  return (
    <AuthShell
      title={asArtist ? "Share your music" : "Sign up to start listening"}
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={!asArtist} className={!asArtist ? "on" : ""} onClick={() => setParams({})}>
          Listener
        </button>
        <button role="tab" aria-selected={asArtist} className={asArtist ? "on" : ""} onClick={() => setParams({ artist: "1" })}>
          Artist
        </button>
      </div>
      <p className="muted small center">Free forever. No ads, no subscriptions, no skip limits.</p>
      {serverError && <div className="form-alert">{serverError}</div>}
      <form className="form" onSubmit={onSubmit} noValidate key={asArtist ? "artist" : "listener"}>
        <Field label={asArtist ? "Artist name" : "Your name"} autoComplete="name" autoFocus error={errors.name} {...register("name")} />
        {!asArtist && <Field label="Username" autoComplete="username" error={errors.username} {...register("username")} />}
        <Field label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
        <Field label="Password" type="password" autoComplete="new-password" error={errors.password} {...register("password")} />
        {asArtist && <Field as="textarea" label="Bio (optional)" error={errors.bio} {...register("bio")} />}
        <button className="btn btn-accent btn-block" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Creating account…" : asArtist ? "Create artist account" : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
