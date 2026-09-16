// services/users.js
import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Cria/atualiza o perfil na primeira vez que o usuário loga
// Chame isso dentro do seu AuthContext, no listener de onAuthStateChanged
export async function criarOuAtualizarPerfil(usuarioAuth) {
  const perfilRef = doc(db, "users", usuarioAuth.uid);
  const perfilExistente = await getDoc(perfilRef);

  if (!perfilExistente.exists()) {
    await setDoc(perfilRef, {
      nome: usuarioAuth.displayName || "Usuário",
      email: usuarioAuth.email,
      avatar: usuarioAuth.photoURL || null,
      criadoEm: serverTimestamp(),
    });
  }
}

export async function buscarPerfil(uid) {
  const perfilRef = doc(db, "users", uid);
  const snap = await getDoc(perfilRef);
  return snap.exists() ? snap.data() : null;
}

export async function atualizarPerfil(uid, dados) {
  const perfilRef = doc(db, "users", uid);
  await setDoc(perfilRef, dados, { merge: true });
}