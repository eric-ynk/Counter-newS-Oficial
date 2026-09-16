// services/comentarios.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

// Adiciona um comentário em um artigo
export async function adicionarComentario(artigoSlug, uid, texto) {
  await addDoc(collection(db, "comentarios"), {
    artigoSlug,
    uid,
    texto,
    criadoEm: serverTimestamp(),
  });
}

// Escuta em tempo real os comentários de um artigo, ordenados por data
// Retorna a função de "unsubscribe" — chame no cleanup do useEffect
export function escutarComentarios(artigoSlug, callback) {
  const q = query(
    collection(db, "comentarios"),
    where("artigoSlug", "==", artigoSlug),
    orderBy("criadoEm", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const comentarios = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(comentarios);
  });
}

export async function excluirComentario(comentarioId) {
  await deleteDoc(doc(db, "comentarios", comentarioId));
}