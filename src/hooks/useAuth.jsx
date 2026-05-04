import { createContext, useContext, useState, useCallback } from "react";
import { login as loginAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("spk_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    try {
      const { data } = await loginAPI({ username, password });

      const token = data.token;
      const userData = data.user;

      // simpan ke localStorage
      localStorage.setItem("spk_token", token);
      localStorage.setItem("spk_user", JSON.stringify(userData));

      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "Login gagal. Periksa username dan password.",
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("spk_token");
    localStorage.removeItem("spk_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);