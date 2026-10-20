import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext.jsx";

export default function useApi(path) {
  const { request } = useContext(UserContext);
  const [version, setVersion] = useState(0);
  const key = path ? `${path}:${version}` : null;
  const [result, setResult] = useState({ key: null, data: null, error: "" });
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    request(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error: error.message });
      });
    return () => controller.abort();
  }, [path, key, request]);

  return {
    loading: Boolean(path) && result.key !== key,
    data: result.key === key ? result.data : null,
    error: result.key === key ? result.error : "",
    reload,
  };
}
