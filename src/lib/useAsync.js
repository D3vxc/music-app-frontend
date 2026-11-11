import { useEffect, useState } from 'react';

export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: undefined, error, loading: false }));
    return () => {
      alive = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
