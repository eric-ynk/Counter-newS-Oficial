import { useEffect, useState } from "react";
import { useAuth } from "./Authcontext";
import { useNavigate, Link } from "react-router";
import { db } from "./firebase.js";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, deleteDoc, doc, getDoc
} from 'firebase/firestore'
import { Trash2 } from "lucide-react";
import "./comentarios.css";

function getInicialNome(nome) {
  if (!nome) return "?";
  return nome.charAt(0).toUpperCase();
}

function Comentarios({ slug }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [comentarios, setComentarios] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return }
    getDoc(doc(db, 'Users', user.uid))
      .then((snap) => setAvatarUrl(snap.exists() ? snap.data().avatarUrl || null : null))
      .catch((err) => console.error('Erro ao buscar avatar:', err))
  }, [user])

  useEffect(() => {
    if (!slug) return
    const q = query(collection(db, 'posts', slug, 'comments'), orderBy('criadoEm', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setComentarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => console.error('Erro ao carregar comentários:', err))
    return () => unsub()
  }, [slug])

  async function enviarComentario(e) {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    const conteudo = texto.trim()
    if (!conteudo || enviando) return

    setEnviando(true)
    try {
      await addDoc(collection(db, 'posts', slug, 'comments'), {
        texto: conteudo,
        uid: user.uid,
        autorNome: user.displayName || user.email,
        autorFoto: avatarUrl,
        criadoEm: serverTimestamp(),
      })
      setTexto('')
    } catch (err) {
      console.error('Erro ao enviar comentário:', err)
    } finally {
      setEnviando(false)
    }
  }

  async function excluirComentario(id) {
    try {
      await deleteDoc(doc(db, "posts", slug, "comments", id));
    } catch (err) {
      console.error("Erro ao excluir comentário:", err);
    }
  }

  function formatarData(timestamp) {
    if (!timestamp?.toDate) return "agora";
    return timestamp.toDate().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="comentarios-bloco">
      {user ? (
        <form className="comentario-form" onSubmit={enviarComentario}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Deixe seu comentário..."
            maxLength={500}
            rows={3}
          />
          <button type="submit" disabled={enviando || !texto.trim()}>
            {enviando ? "Enviando..." : "Comentar"}
          </button>
        </form>
      ) : (
        <p className="comentario-login-aviso">
          <Link to="/login">Faça login</Link> para comentar.
        </p>
      )}

      {comentarios.length === 0 ? (
        <p className="comentario-vazio">Seja o primeiro a comentar.</p>
      ) : (
        <ul className="comentario-lista">
          {comentarios.map((c) => (
            <li key={c.id} className="comentario-item">
              <div className="comentario-cabecalho">
                {c.autorFoto ? (
                  <img
                    src={c.autorFoto}
                    alt={c.autorNome}
                    className="comentario-avatar"
                  />
                ) : (
                  <span className="comentario-avatar comentario-avatar--letra">
                    {getInicialNome(c.autorNome)}
                  </span>
                )}
                <div className="comentario-cabecalho-texto">
                  <span className="comentario-autor">{c.autorNome}</span>
                  <span className="comentario-data">
                    {formatarData(c.criadoEm)}
                  </span>
                </div>
              </div>
              <p className="comentario-texto">{c.texto}</p>
              {user?.uid === c.uid && (
                <button
                  className="comentario-excluir"
                  onClick={() => excluirComentario(c.id)}
                  aria-label="Excluir comentário"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Comentarios;
