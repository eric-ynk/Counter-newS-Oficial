import './engajamento.css'
import { Heart, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { doc, getDoc, setDoc, deleteDoc, collection, getCountFromServer } from 'firebase/firestore';
import { db } from './firebase.js';
import { useAuth } from './Authcontext';

// modo: 'resumo' (card na home, deixa o clique no comentário navegar pro <Link> pai)
//       'completo' (página da notícia, rola até #comentarios)
// tamanho: 'normal' | 'grande'
function Engajamento({ slug, modo = 'resumo', tamanho = 'normal' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [curtidas, setCurtidas] = useState(0);
  const [comentarios, setComentarios] = useState(0);
  const [curtiu, setCurtiu] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const likesRef = collection(db, 'posts', slug, 'likes');
    const commentsRef = collection(db, 'posts', slug, 'comments');

    getCountFromServer(likesRef)
      .then((snap) => setCurtidas(snap.data().count))
      .catch((err) => console.error('Erro ao contar curtidas:', err));

    getCountFromServer(commentsRef)
      .then((snap) => setComentarios(snap.data().count))
      .catch((err) => console.error('Erro ao contar comentários:', err));
  }, [slug]);

  useEffect(() => {
    if (!slug || !user) {
      setCurtiu(false);
      return;
    }
    getDoc(doc(db, 'posts', slug, 'likes', user.uid))
      .then((snap) => setCurtiu(snap.exists()))
      .catch((err) => console.error('Erro ao checar curtida:', err));
  }, [slug, user]);

  const alternarCurtida = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }
    if (carregando) return;

    setCarregando(true);
    const likeRef = doc(db, 'posts', slug, 'likes', user.uid);

    try {
      if (curtiu) {
        await deleteDoc(likeRef);
        setCurtiu(false);
        setCurtidas((c) => Math.max(0, c - 1));
      } else {
        await setDoc(likeRef, { criadoEm: Date.now() });
        setCurtiu(true);
        setCurtidas((c) => c + 1);
      }
    } catch (err) {
      console.error('Erro ao curtir:', err);
    } finally {
      setCarregando(false);
    }
  };

  const clicarComentario = (e) => {
    if (modo === 'completo') {
      e.preventDefault();
      e.stopPropagation();
      const el = document.getElementById('comentarios');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    // modo 'resumo': deixa o clique borbulhar pro <Link> do card, que já leva pra notícia
  };

  const tamanhoIcone = tamanho === 'grande' ? 22 : 18;

  return (
    <div className={`engajamento ${tamanho === 'grande' ? 'engajamento-grande' : ''}`}>
      <button
        type='button'
        className={`engajamento-btn ${curtiu ? 'curtido' : ''}`}
        onClick={alternarCurtida}
        disabled={carregando}
        aria-pressed={curtiu}
        aria-label={curtiu ? 'Remover curtida' : 'Curtir notícia'}
      >
        <Heart size={tamanhoIcone} fill={curtiu ? '#E8546B' : 'none'} aria-hidden="true" />
        <span>{curtidas}</span>
      </button>

      <button
        type='button'
        className='engajamento-btn'
        onClick={clicarComentario}
        aria-label='Ver comentários'
      >
        <MessageCircle size={tamanhoIcone} aria-hidden="true" />
        <span>{comentarios}</span>
      </button>
    </div>
  );
}

export default Engajamento;