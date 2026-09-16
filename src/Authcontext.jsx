import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase"; // ajuste o caminho conforme seu projeto
import { onAuthStateChanged, signOut } from "firebase/auth";
import { criarOuAtualizarPerfil } from "./funcoes/users";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        await criarOuAtualizarPerfil(usuario);
      }
      setUser(usuario);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loadingAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);