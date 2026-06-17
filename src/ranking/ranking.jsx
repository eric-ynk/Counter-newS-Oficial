import './ranking.css'
import '../global.css'
import { Link, useNavigate } from 'react-router'
import { useRef, useState, useEffect } from 'react'
import LogoHeader from '../assets/Logo menor.png'
import { useAuth } from '../Authcontext'
import client from '../sanity'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(client)
function urlFor(source) {
  return builder.image(source).url()
}

// Mapa de código ISO → emoji de bandeira
function codigoParaBandeira(codigo) {
  if (!codigo) return ''
  return codigo
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('')
}

const rankingQuery = `*[_type == "equipe"] | order(posicao asc) {
  _id,
  posicao,
  nome,
  slug,
  logo,
  pontos,
  organizacao,
  dataRanking,
  elenco[] {
    funcaoNaEquipe,
    jogador-> {
      nomeIngame,
      funcao,
      codigoBandeira,
      foto
    }
  }
}`

function formatarDataRanking(dataStr) {
  if (!dataStr) return ''
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${mes}/${ano}`
}

function Ranking() {
  const { user, loadingAuth, logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [equipes, setEquipes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    client.fetch(rankingQuery)
      .then(data => { setEquipes(data); setCarregando(false) })
      .catch(err => { console.error('Erro ao buscar ranking:', err); setCarregando(false) })
  }, [])

  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  function getInicial(user) {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase()
    if (user.email) return user.email.charAt(0).toUpperCase()
    return '?'
  }

  async function handleLogout() {
    await logout()
    setMenuAberto(false)
  }

  // Pega a data do ranking (da primeira equipe)
  const dataRanking = equipes.length > 0 ? formatarDataRanking(equipes[0].dataRanking) : ''

  // Separa os jogadores (não coach) e o coach
  function getJogadoresECoach(elenco) {
    if (!elenco) return { jogadores: [], coach: null }
    const coach = elenco.find(m => (m.funcaoNaEquipe || m.jogador?.funcao) === 'Coach')
    const jogadores = elenco.filter(m => (m.funcaoNaEquipe || m.jogador?.funcao) !== 'Coach')
    return { jogadores, coach }
  }

  return (
    <>
      <header className='cabecalho'>
        <Link to="/"><img src={LogoHeader} alt="Logo" id='logo' /></Link>
        <nav className='links'>
          <ul>
            <li className='lista-nav'><Link to="/">Notícias</Link></li>
            <li className='lista-nav'><Link to="/competitivo">Competitivo</Link></li>
            <li className='lista-nav'><Link to="/ranking" className='nav-ativo'>Ranking</Link></li>
            <li className='lista-nav'><a href="#">Comunidade</a></li>
            <li className='lista-nav'><a href="#">Guias</a></li>
          </ul>
        </nav>

        {!loadingAuth && (
          user ? (
            <div className='perfil-wrapper' ref={menuRef}>
              <button className='perfil-btn' onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu do perfil">
                {user.photoURL
                  ? <img src={user.photoURL} alt="Foto de perfil" className='perfil-foto' />
                  : <span className='perfil-inicial'>{getInicial(user)}</span>
                }
              </button>
              {menuAberto && (
                <div className='perfil-menu'>
                  <p className='perfil-email'>{user.displayName || user.email}</p>
                  <hr className='perfil-divisor' />
                  <Link to="/perfil" className='perfil-opcao' onClick={() => setMenuAberto(false)}>Meu perfil</Link>
                  <button className='perfil-opcao perfil-sair' onClick={handleLogout}>Sair</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" id='login' style={{ textDecoration: 'none' }}>Login</Link>
          )
        )}
      </header>

      <main className='rank-main'>
        <div className='rank-titulo-wrapper'>
          <h1 className='rank-titulo'>
            Ranking Oficial — Valve
            {dataRanking && <span className='rank-titulo-data'> — {dataRanking}</span>}
          </h1>
          <p className='rank-subtitulo'>Top — {equipes.length}</p>
        </div>

        {carregando ? (
          <p className='rank-estado'>Carregando ranking...</p>
        ) : equipes.length === 0 ? (
          <p className='rank-estado'>Nenhuma equipe encontrada.</p>
        ) : (
          <div className='rank-lista'>
            {equipes.map((equipe) => {
              const { jogadores, coach } = getJogadoresECoach(equipe.elenco)
              const isTop3 = equipe.posicao <= 3

              return (
                <div
                  key={equipe._id}
                  className={`rank-card ${isTop3 ? 'rank-card--destaque' : ''}`}
                >
                  {/* Cabeçalho da equipe — clicável */}
                  <button
                    className='rank-card-header'
                    onClick={() => navigate(`/ranking/${equipe.slug.current}`)}
                    aria-label={`Ver detalhes de ${equipe.nome}`}
                  >
                    <div className='rank-card-header-esquerda'>
                      {equipe.logo && (
                        <img
                          src={urlFor(equipe.logo)}
                          alt={`Logo ${equipe.nome}`}
                          className='rank-equipe-logo'
                        />
                      )}
                      <div className='rank-equipe-info'>
                        <span className='rank-posicao'>{equipe.posicao}º Lugar</span>
                        <h2 className='rank-equipe-nome'>{equipe.nome}</h2>
                        <span className='rank-pontos'>
                          {equipe.pontos.toLocaleString('pt-BR')} Valve points
                        </span>
                      </div>
                    </div>
                    <div className='rank-card-header-direita'>
                      <span className='rank-org'>ORG — {equipe.organizacao}</span>
                      <span className='rank-seta'>›</span>
                    </div>
                  </button>

                  {/* Elenco */}
                  {equipe.elenco && equipe.elenco.length > 0 && (
                    <div className='rank-elenco'>
                      {/* Jogadores */}
                      <div className='rank-jogadores'>
                        {jogadores.map((membro, idx) => {
                          const funcao = membro.funcaoNaEquipe || membro.jogador?.funcao || ''
                          const bandeira = codigoParaBandeira(membro.jogador?.codigoBandeira)
                          return (
                            <div key={idx} className='rank-jogador-card'>
                              <span className='rank-jogador-funcao'>{funcao}</span>
                              {membro.jogador?.foto && (
                                <img
                                  src={urlFor(membro.jogador.foto)}
                                  alt={membro.jogador.nomeIngame}
                                  className='rank-jogador-foto'
                                />
                              )}
                              <span className='rank-jogador-nick'>
                                {bandeira && <span className='rank-bandeira'>{bandeira}</span>}
                                {membro.jogador?.nomeIngame}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Coach (separado) */}
                      {coach && (
                        <div className='rank-coach-wrapper'>
                          <div className='rank-jogador-card rank-jogador-card--coach'>
                            <span className='rank-jogador-funcao'>Coach</span>
                            {coach.jogador?.foto && (
                              <img
                                src={urlFor(coach.jogador.foto)}
                                alt={coach.jogador.nomeIngame}
                                className='rank-jogador-foto'
                              />
                            )}
                            <span className='rank-jogador-nick'>
                              {codigoParaBandeira(coach.jogador?.codigoBandeira) && (
                                <span className='rank-bandeira'>
                                  {codigoParaBandeira(coach.jogador.codigoBandeira)}
                                </span>
                              )}
                              {coach.jogador?.nomeIngame}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}

export default Ranking