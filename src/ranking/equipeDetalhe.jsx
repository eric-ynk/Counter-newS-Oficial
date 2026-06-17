import './equipeDetalhe.css'
import '../global.css'
import { Link, useParams, useNavigate } from 'react-router'
import { useRef, useState, useEffect } from 'react'
import LogoHeader from '../assets/Logo menor.png'
import { useAuth } from '../Authcontext'
import client from '../sanity'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(client)
function urlFor(source) {
  return builder.image(source).url()
}

function codigoParaBandeira(codigo) {
  if (!codigo) return ''
  return codigo
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('')
}

const equipeQuery = `*[_type == "equipe" && slug.current == $slug][0] {
  _id,
  posicao,
  nome,
  logo,
  pontos,
  organizacao,
  dataRanking,
  elenco[] {
    funcaoNaEquipe,
    jogador-> {
      _id,
      nomeIngame,
      nomeReal,
      idade,
      funcao,
      pais,
      codigoBandeira,
      foto,
      descricaoCurta,
      biografia
    }
  },
  trofeus[] {
    ano,
    conquistasCount,
    dataPrimeiraConquista,
    itens[] {
      nome,
      logo
    }
  },
  galeria[] {
    imagem,
    legenda
  }
}`

function formatarDataRanking(dataStr) {
  if (!dataStr) return ''
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${mes}/${ano}`
}

function EquipeDetalhe() {
  const { slug } = useParams()
  const { user, loadingAuth, logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [equipe, setEquipe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [jogadorSelecionado, setJogadorSelecionado] = useState(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    client.fetch(equipeQuery, { slug })
      .then(data => { setEquipe(data); setCarregando(false) })
      .catch(err => { console.error('Erro ao buscar equipe:', err); setCarregando(false) })
  }, [slug])

  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  // Fecha modal do jogador ao clicar fora
  useEffect(() => {
    if (!jogadorSelecionado) return
    function handleEsc(e) {
      if (e.key === 'Escape') setJogadorSelecionado(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [jogadorSelecionado])

  function getInicial(user) {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase()
    if (user.email) return user.email.charAt(0).toUpperCase()
    return '?'
  }

  async function handleLogout() {
    await logout()
    setMenuAberto(false)
  }

  // Separa jogadores e coach
  function getJogadoresECoach(elenco) {
    if (!elenco) return { jogadores: [], coach: null }
    const coach = elenco.find(m => (m.funcaoNaEquipe || m.jogador?.funcao) === 'Coach')
    const jogadores = elenco.filter(m => (m.funcaoNaEquipe || m.jogador?.funcao) !== 'Coach')
    return { jogadores, coach }
  }

  // Ordena troféus por ano desc
  function getTrofeusOrdenados(trofeus) {
    if (!trofeus) return []
    return [...trofeus].sort((a, b) => b.ano - a.ano)
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

      <main className='ed-main'>
        {carregando ? (
          <p className='ed-estado'>Carregando...</p>
        ) : !equipe ? (
          <div className='ed-estado'>
            <p>Equipe não encontrada.</p>
            <button className='ed-voltar-btn' onClick={() => navigate('/ranking')}>← Voltar ao ranking</button>
          </div>
        ) : (
          <>
            {/* ── Hero da equipe ── */}
            <section className='ed-hero'>
              <button className='ed-voltar' onClick={() => navigate('/ranking')}>
                ← Ranking
              </button>
              <div className='ed-hero-conteudo'>
                {equipe.logo && (
                  <img
                    src={urlFor(equipe.logo)}
                    alt={`Logo ${equipe.nome}`}
                    className='ed-hero-logo'
                  />
                )}
                <div className='ed-hero-info'>
                  <span className='ed-hero-posicao'>{equipe.posicao}º lugar do mundo</span>
                  <h1 className='ed-hero-nome'>{equipe.nome}</h1>
                  <div className='ed-hero-meta'>
                    <span className='ed-hero-pontos'>{equipe.pontos.toLocaleString('pt-BR')} Valve points</span>
                    <span className='ed-hero-org'>ORG — {equipe.organizacao}</span>
                  </div>
                  {equipe.dataRanking && (
                    <span className='ed-hero-data'>
                      Ranking de {formatarDataRanking(equipe.dataRanking)}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ── Troféus ── */}
            {equipe.trofeus && equipe.trofeus.length > 0 && (
              <section className='ed-secao'>
                <h2 className='ed-secao-titulo'>Galeria de troféus</h2>
                <div className='ed-trofeus'>
                  {getTrofeusOrdenados(equipe.trofeus).map((anoTrofeu, idx) => (
                    <div key={idx} className='ed-trofeu-ano'>
                      <div className='ed-trofeu-ano-header'>
                        <span className='ed-trofeu-ano-num'>{anoTrofeu.ano}</span>
                        <span className='ed-trofeu-count'>
                          {anoTrofeu.conquistasCount} conquista{anoTrofeu.conquistasCount !== 1 ? 's' : ''}
                          {anoTrofeu.dataPrimeiraConquista && ` — ${anoTrofeu.dataPrimeiraConquista}`}
                        </span>
                      </div>
                      {anoTrofeu.itens && anoTrofeu.itens.length > 0 && (
                        <div className='ed-trofeu-itens'>
                          {anoTrofeu.itens.map((trofeu, ti) => (
                            <div key={ti} className='ed-trofeu-item' title={trofeu.nome}>
                              {trofeu.logo ? (
                                <img
                                  src={urlFor(trofeu.logo)}
                                  alt={trofeu.nome}
                                  className='ed-trofeu-logo'
                                />
                              ) : (
                                <div className='ed-trofeu-logo-placeholder'>🏆</div>
                              )}
                              <span className='ed-trofeu-nome'>{trofeu.nome}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Jogadores ── */}
            {equipe.elenco && equipe.elenco.length > 0 && (() => {
              const { jogadores, coach } = getJogadoresECoach(equipe.elenco)
              return (
                <section className='ed-secao'>
                  <h2 className='ed-secao-titulo'>Jogadores</h2>
                  <div className='ed-jogadores-grid'>
                    {jogadores.map((membro, idx) => {
                      const j = membro.jogador
                      const funcao = membro.funcaoNaEquipe || j?.funcao || ''
                      const bandeira = codigoParaBandeira(j?.codigoBandeira)
                      return (
                        <button
                          key={idx}
                          className='ed-jogador-card'
                          onClick={() => setJogadorSelecionado(membro)}
                          aria-label={`Ver perfil de ${j?.nomeIngame}`}
                        >
                          {j?.foto && (
                            <img
                              src={urlFor(j.foto)}
                              alt={j.nomeIngame}
                              className='ed-jogador-foto'
                            />
                          )}
                          <div className='ed-jogador-rodape'>
                            <span className='ed-jogador-funcao'>{funcao}</span>
                            <span className='ed-jogador-nick'>
                              {bandeira && <span>{bandeira}</span>}
                              {j?.nomeIngame}
                            </span>
                          </div>
                        </button>
                      )
                    })}

                    {/* Coach */}
                    {coach && (() => {
                      const j = coach.jogador
                      const bandeira = codigoParaBandeira(j?.codigoBandeira)
                      return (
                        <button
                          className='ed-jogador-card ed-jogador-card--coach'
                          onClick={() => setJogadorSelecionado(coach)}
                          aria-label={`Ver perfil de ${j?.nomeIngame} (Coach)`}
                        >
                          {j?.foto && (
                            <img
                              src={urlFor(j.foto)}
                              alt={j.nomeIngame}
                              className='ed-jogador-foto'
                            />
                          )}
                          <div className='ed-jogador-rodape'>
                            <span className='ed-jogador-funcao'>Coach</span>
                            <span className='ed-jogador-nick'>
                              {bandeira && <span>{bandeira}</span>}
                              {j?.nomeIngame}
                            </span>
                          </div>
                        </button>
                      )
                    })()}
                  </div>
                </section>
              )
            })()}

            {/* ── Galeria de fotos ── */}
            {equipe.galeria && equipe.galeria.length > 0 && (
              <section className='ed-secao'>
                <h2 className='ed-secao-titulo'>Galeria de fotos</h2>
                <div className='ed-galeria'>
                  {equipe.galeria.map((foto, idx) => (
                    <div key={idx} className='ed-galeria-item'>
                      <img
                        src={urlFor(foto.imagem)}
                        alt={foto.legenda || `Foto ${idx + 1}`}
                        className='ed-galeria-foto'
                      />
                      {foto.legenda && (
                        <p className='ed-galeria-legenda'>{foto.legenda}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Modal do jogador ── */}
      {jogadorSelecionado && (() => {
        const j = jogadorSelecionado.jogador
        const funcao = jogadorSelecionado.funcaoNaEquipe || j?.funcao || ''
        const bandeira = codigoParaBandeira(j?.codigoBandeira)
        return (
          <div
            className='ed-modal-overlay'
            onClick={() => setJogadorSelecionado(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Perfil de ${j?.nomeIngame}`}
          >
            <div className='ed-modal' onClick={e => e.stopPropagation()}>
              <button
                className='ed-modal-fechar'
                onClick={() => setJogadorSelecionado(null)}
                aria-label="Fechar"
              >
                ✕
              </button>

              <div className='ed-modal-topo'>
                {j?.foto && (
                  <img
                    src={urlFor(j.foto)}
                    alt={j.nomeIngame}
                    className='ed-modal-foto'
                  />
                )}
                <div className='ed-modal-info'>
                  <span className='ed-modal-funcao'>{funcao}</span>
                  <h3 className='ed-modal-nick'>{j?.nomeIngame}</h3>
                  <div className='ed-modal-meta'>
                    {j?.nomeReal && <p><strong>Nome:</strong> {j.nomeReal}</p>}
                    {j?.idade && <p><strong>Idade:</strong> {j.idade} anos</p>}
                    {j?.pais && (
                      <p>
                        <strong>Nasceu na</strong> {j.pais} {bandeira}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {j?.descricaoCurta && (
                <p className='ed-modal-destaque'>{j.descricaoCurta}</p>
              )}

              {j?.biografia && (
                <p className='ed-modal-bio'>{j.biografia}</p>
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}

export default EquipeDetalhe