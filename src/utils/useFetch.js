import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../api";

/** GET `url` (skip when null). Returns { data, error, loading, reload, setData }. */
export default function useFetch(url) {
  const [state, setState] = useState({ url: null, data: null, error: null, pending: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    setState((s) => ({ ...s, pending: true, error: null }));
    api
      .get(url)
      .then((res) => alive && setState({ url, data: res.data, error: null, pending: false }))
      .catch((e) => alive && setState({ url, data: null, error: errorMessage(e), pending: false }));
    return () => {
      alive = false;
    };
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((update) => {
    setState((s) => ({ ...s, data: typeof update === "function" ? update(s.data) : update }));
  }, []);

  // Data from a previous URL never leaks into the current one (e.g. navigating artist A -> B).
  const fresh = state.url === url;
  return {
    data: fresh ? state.data : null,
    error: fresh ? state.error : null,
    loading: !!url && (state.pending || !fresh),
    reload,
    setData,
  };
}
