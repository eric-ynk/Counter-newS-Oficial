// services/interacoes.js
import { db } from "../firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

// ---------- FAVORITOS ----------

export async function favoritarArtigo(uid, slug, dadosArtigo) {
  const ref = doc(db, "favoritos", uid, "artigos", slug);
  await setDoc(ref, { ...dadosArtigo, salvoEm: new Date() });
}

export async function desfavoritarArtigo(uid, slug) {
  const ref = doc(db, "favoritos", uid, "artigos", slug);
  await deleteDoc(ref);
}

export async function listarFavoritos(uid) {
  const snap = await getDocs(collection(db, "favoritos", uid, "artigos"));
  return snap.docs.map((d) => ({ slug: d.id, ...d.data() }));
}

export async function verificarFavorito(uid, slug) {
  const ref = doc(db, "favoritos", uid, "artigos", slug);
  const snap = await getDoc(ref);
  return snap.exists();
}

// ---------- CURTIDAS ----------

export async function curtirArtigo(artigoSlug, uid) {
  const ref = doc(db, "curtidas", artigoSlug, "users", uid);
  await setDoc(ref, { curtidoEm: new Date() });
}

export async function descurtirArtigo(artigoSlug, uid) {
  const ref = doc(db, "curtidas", artigoSlug, "users", uid);
  await deleteDoc(ref);
}

export async function contarCurtidas(artigoSlug) {
  const snap = await getDocs(collection(db, "curtidas", artigoSlug, "users"));
  return snap.size;
}