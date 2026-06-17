import './inicio.css'
import { useNavigate, Link } from 'react-router';
import { useEffect, useState, useRef } from 'react'
import { postsQuery, postPrincipalQuery } from '../queries'
import client from '../sanity'
import LogoHeader from '../assets/Logo menor.png'
import NoticiaPrincipalImg from '../assets/Group 4.png'
import { useAuth } from '../Authcontext'

function Inicio() {
  const [postPrincipal, setPostPrincipal] = useState(null);
  const [posts, setPosts] = useState([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);
  const { user, loadingAuth, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    client.fetch(postPrincipalQuery)
      .then((data) => setPostPrincipal(data))
      .catch((err) => console.error("Erro post principal:", err));

    client.fetch(postsQuery)
      .then((data) => setPosts(data))
      .catch((err) => console.error("Erro posts:", err));
  }, []);

  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  function getInicial(user) {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return '?';
  }

  async function handleLogout() {
    await logout();
    setMenuAberto(false);
  }

  // Função simplificada: executa qualquer lógica extra e navega imediatamente
  function goTo(path, extraCallback) {
    extraCallback?.();
    navigate(path);
  }

  return (
    <>
      <header className='cabecalho'>
        {/* Logo → Início */}
        <a href="/" onClick={(e) => { e.preventDefault(); goTo('/'); }}>
          <img src={LogoHeader} alt="Logo" id='logo' />
        </a>

        <nav className='links'>
          <ul>
            <li className='lista-nav'>
              <a href="/competitivo" onClick={(e) => { e.preventDefault(); goTo('/competitivo'); }}>
                Competitivo
              </a>
            </li>
            <li className='lista-nav'><Link to="/atualizacoes">Atualizações</Link></li>
            <li className='lista-nav'><a href="#">Ranking</a></li>
            <li className='lista-nav'><a href="#">Comunidade</a></li>
            <li className='lista-nav'><a href="#">Guias</a></li>
          </ul>
        </nav>

        {!loadingAuth && (
          user ? (
            <div className='perfil-wrapper' ref={menuRef}>
              <button
                className='perfil-btn'
                onClick={() => setMenuAberto(!menuAberto)}
                aria-label="Menu do perfil"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Foto de perfil" className='perfil-foto' />
                ) : (
                  <span className='perfil-inicial'>{getInicial(user)}</span>
                )}
              </button>

              {menuAberto && (
                <div className='perfil-menu'>
                  <p className='perfil-email'>{user.displayName || user.email}</p>
                  <hr className='perfil-divisor' />
                  <a
                    href="/perfil"
                    className='perfil-opcao'
                    onClick={(e) => { e.preventDefault(); goTo('/perfil', () => setMenuAberto(false)); }}
                  >
                    Meu perfil
                  </a>
                  <button className='perfil-opcao perfil-sair' onClick={handleLogout}>
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              id='login'
              style={{ textDecoration: 'none' }}
              onClick={(e) => { e.preventDefault(); goTo('/login'); }}
            >
              Login
            </a>
          )
        )}
      </header>

      <h1 id='principal'>Principais Notícias</h1>

      {postPrincipal && (
        <div id='div-principal'>
          <img src={postPrincipal.imageUrl || NoticiaPrincipalImg} alt={postPrincipal.title} id='noticia-principal' />
          <h6 id='creditos'>Créditos da foto: {postPrincipal.authorCredit}</h6>
          <p>{postPrincipal.title}</p>
          <span>
            Publicado em {new Date(postPrincipal.publishedAt).toLocaleString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
              timeZone: 'America/Sao_Paulo'
            })}
          </span>
        </div>
      )}

      <section className="noticias-container">
        {posts.slice(1).map((post, index) => {
          const bloqueada = !user && index >= 2;

          return (
            <div className={`card ${bloqueada ? 'card-bloqueado' : ''}`} key={post._id}>
              <div className="image-wrapper">
                <img src={post.imageUrl} alt={post.title} />
                {bloqueada && (
                  <div className='card-overlay'>
                    <span className='cadeado'>🔒</span>
                  </div>
                )}
              </div>
              <p className="credito">Créditos: {post.authorCredit}</p>
              <h3>{post.title}</h3>

              {bloqueada && (
                <div className='paywall-card'>
                  <p>Faça login para ler esta notícia</p>
                  <a
                    href="/login"
                    className='paywall-btn'
                    onClick={(e) => { e.preventDefault(); goTo('/login'); }}
                  >
                    Entrar
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className='seguidos'>
        <h1 id='seguido'>Seus seguidos</h1>
        {user ? (
          <p id='secao-login'>Bem-vindo, {user.displayName || user.email}! Aqui estão seus seguidos.</p>
        ) : (
          <p id='secao-login'>
            <a
              href="/login"
              style={{ color: 'inherit' }}
              onClick={(e) => { e.preventDefault(); goTo('/login'); }}
            >
              Faça login
            </a>{' '}
             para poder acessar essa seção
          </p>
        )}
      </section>
    </>
  )
}

export default Inicio;