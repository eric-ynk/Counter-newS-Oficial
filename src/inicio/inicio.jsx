import './inicio.css'
import { useNavigate, Link } from 'react-router';
import { useEffect, useState } from 'react'
import { postsQuery, postPrincipalQuery } from '../queries'
import client from '../sanity'
import NoticiaPrincipalImg from '../assets/Group 4.png'
import { useAuth } from '../Authcontext'
import { useConfig } from '../useConfig'
import { Eye, Lock } from 'lucide-react'
import Engajamento from '../Engajamento'
import '../scroll.css'

function Inicio() {
  const [postPrincipal, setPostPrincipal] = useState(null);
  const [posts, setPosts] = useState([]);
  const [times, setTimes] = useState([]);
  const { user, loadingAuth } = useAuth();
  const config = useConfig();
  const semSpoiler = !!config.semSpoiler;
  const favoritos = config.timesFavoritos || [];
  const [revelados, setRevelados] = useState(() => new Set());
  const [revelarPrincipal, setRevelarPrincipal] = useState(false);
  const revelar = (id) => setRevelados((prev) => new Set(prev).add(id));

  useEffect(() => {
    client.fetch(postPrincipalQuery)
      .then((data) => setPostPrincipal(data))
      .catch((err) => console.error("Erro post principal:", err));

    client.fetch(postsQuery)
      .then((data) => setPosts(data))
      .catch((err) => console.error("Erro posts:", err));

    client.fetch('*[_type=="equipe"]|order(posicao asc){nome,"slug":slug.current,"logoUrl":logo.asset->url,posicao}')
      .then((data) => setTimes(data || []))
      .catch((err) => console.error("Erro equipes:", err));
  }, []);

  const timesFavoritos = times.filter((t) => favoritos.includes(t.slug));
  return (
    <>

      <h1 id='principal'>Principais Notícias</h1>

      {postPrincipal && (() => {
        const principalOculto = semSpoiler && !revelarPrincipal;
        return (
        <Link to={`/noticia/${postPrincipal.slug}`} id='div-principal' style={{ textDecoration: 'none' }}>
          <div className={`principal-img-wrap ${principalOculto ? 'spoiler-blur' : ''}`}>
            <img src={postPrincipal.imageUrl || NoticiaPrincipalImg} alt={postPrincipal.title} id='noticia-principal' />
            {principalOculto && (
              <button className='spoiler-overlay' onClick={(e) => { e.preventDefault(); setRevelarPrincipal(true); }}>
                <span className='spoiler-titulo'><Eye size={18} aria-hidden="true" /> Conteúdo oculto</span>
                <span className='spoiler-sub'>Clique para revelar</span>
              </button>
            )}
          </div>
          <h6 id='creditos'>Créditos da foto: {postPrincipal.authorCredit}</h6>
          <p className={principalOculto ? 'spoiler-blur-text' : ''}>{postPrincipal.title}</p>
          <span>
            Publicado em {new Date(postPrincipal.publishedAt).toLocaleString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
              timeZone: 'America/Sao_Paulo'
            })}
          </span>
          <Engajamento slug={postPrincipal.slug} modo="resumo" />
        </Link>
        );
      })()}

      <section className="noticias-container">
        {posts.slice(1).map((post, index) => {
          const bloqueada = !user && index >= 2;
          const oculto = semSpoiler && !bloqueada && !revelados.has(post._id);

          const conteudoCard = (
            <>
              <div className={`image-wrapper ${oculto ? 'spoiler-blur' : ''}`}>
                <img src={post.imageUrl} alt={post.title} />
                {bloqueada && (
                  <div className='card-overlay'>
                    <Lock size={32} className='cadeado' aria-hidden="true" />
                  </div>
                )}
                {oculto && (
                  <button className='spoiler-overlay' onClick={(e) => { e.preventDefault(); revelar(post._id); }}>
                    <span className='spoiler-titulo'><Eye size={18} aria-hidden="true" /> Conteúdo oculto</span>
                    <span className='spoiler-sub'>Clique para revelar</span>
                  </button>
                )}
              </div>
              <p className="credito">Créditos: {post.authorCredit}</p>
              <h3 className={oculto ? 'spoiler-blur-text' : ''}>{post.title}</h3>
              {post.publishedAt && (
                <span className="data-card">
                  Publicado em {new Date(post.publishedAt).toLocaleString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                    timeZone: 'America/Sao_Paulo'
                  })}
                </span>
              )}
              <Engajamento slug={post.slug} modo="resumo" />
            </>
          );

          return (
            <div className={`card ${bloqueada ? 'card-bloqueado' : ''}`} key={post._id}>
              {bloqueada ? (
                <>
                  {conteudoCard}
                  <div className='paywall-card'>
                    <p>Faça login para ler esta notícia</p>
                    <Link to="/login" className='paywall-btn'>Entrar</Link>
                  </div>
                </>
              ) : (
                <Link to={`/noticia/${post.slug}`} style={{ textDecoration: 'none' }}>
                  {conteudoCard}
                </Link>
              )}
            </div>
          );
        })}
      </section>

      <section className='seguidos'>
        <h1 id='seguido'>Seus times favoritos</h1>
        {!user ? (
          <p id='secao-login'>
            <Link to="/login" style={{ color: 'inherit' }}>Faça login</Link>
            <span>para acompanhar seus times favoritos</span>
          </p>
        ) : timesFavoritos.length === 0 ? (
          <p className='fav-vazio'>
            Você ainda não escolheu times favoritos.{' '}
            <Link to="/configuracoes" className='fav-vazio-link'>Escolha nas configurações</Link>
          </p>
        ) : (
          <div className='fav-times'>
            {timesFavoritos.map((t) => (
              <Link key={t.slug} to={`/ranking/${t.slug}`} className='fav-time-card'>
                {t.logoUrl && <img src={t.logoUrl} alt={t.nome} className='fav-time-logo' />}
                <span className='fav-time-nome'>{t.nome}</span>
                <span className='fav-time-pos'>{t.posicao}º no ranking</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

export default Inicio;