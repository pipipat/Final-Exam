import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "../lib/api.js";

// Keep the context and provider together as in the starter project.
// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    api("/api/auth/me", {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setUser(data.user);
        }
      })
      .catch((error) => {
        if (
          !controller.signal.aborted &&
          error.status !== 401
        ) {
          setSessionError(
            "Unable to connect. Please try signing in again."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const login = useCallback(
    async (identifier, password) => {
      setSessionError("");

      const data = await api("/api/auth/login", {
        method: "POST",
        body: { identifier, password },
      });

      setUser(data.user);
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await api("/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
  }, []);

  const request = useCallback(async (path, options) => {
    try {
      return await api(path, options);
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
      }

      throw error;
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        sessionError,
        login,
        logout,
        request,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}