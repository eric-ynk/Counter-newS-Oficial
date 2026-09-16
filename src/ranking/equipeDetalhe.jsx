import './equipeDetalhe.css'
import '../global.css'
import { Link, useParams, useNavigate } from 'react-router'
import { useRef, useState, useEffect } from 'react'
import LogoHeader from '../assets/Logo menor.png'
import { useAuth } from '../Authcontext'
import client from '../sanity'
import '../scroll.css'
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

// Bandeira em imagem (emoji de bandeira não renderiza no Windows)
function urlBandeira(codigo) {
  if (!codigo) return ''
  return `https://flagcdn.com/w40/${codigo.toLowerCase()}.png`
}

const equipeQuery = `*[_type == "equipe" && slug.current == $slug][0] {
  _id,
  posicao,
  nome,
  logo,
  identidadeVisual {
    corPrimaria,
    corSecundaria,
    corFundo,
    corCards,
    corTexto,
    estiloCards,
    opacidadeLogo
  },
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

function getCorDaPosicao(posicao) {
  const posicaoNumerica = Number(posicao)
  if (posicaoNumerica === 1) return '#e3b319'
  if (posicaoNumerica === 2) return '#c8ced8'
  if (posicaoNumerica === 3) return '#c47a3a'
  return '#6ea8fe'
}

function normalizarCor(cor, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(cor || '') ? cor : fallback
}

function hexParaRgb(cor) {
  const hex = cor.replace('#', '')
  return `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}`
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

  const corDaPosicao = getCorDaPosicao(equipe?.posicao)
  const logoEquipeUrl = equipe?.logo ? urlFor(equipe.logo) : ''
  const identidadeVisual = equipe?.identidadeVisual || {}
  const corPrimaria = normalizarCor(identidadeVisual.corPrimaria, corDaPosicao)
  const corSecundaria = normalizarCor(identidadeVisual.corSecundaria, '#9db4e8')
  const corFundo = normalizarCor(identidadeVisual.corFundo, '#141a30')
  const corCards = normalizarCor(identidadeVisual.corCards, '#1e2547')
  const corTexto = normalizarCor(identidadeVisual.corTexto, '#ffffff')
  const estilosCardsPermitidos = ['equilibrado', 'vidro', 'contorno']
  const estiloCards = estilosCardsPermitidos.includes(identidadeVisual.estiloCards)
    ? identidadeVisual.estiloCards
    : 'equilibrado'
  const opacidadeLogo = Math.min(20, Math.max(0, Number(identidadeVisual.opacidadeLogo ?? 8))) / 100
  const estiloDaEquipe = {
    '--ed-rank-color': corPrimaria,
    '--ed-rank-rgb': hexParaRgb(corPrimaria),
    '--ed-rank-soft': corSecundaria,
    '--ed-team-secondary': corSecundaria,
    '--ed-page-bg': corFundo,
    '--ed-card-bg': corCards,
    '--ed-text-color': corTexto,
    '--ed-logo-opacity': opacidadeLogo,
    ...(logoEquipeUrl ? { '--ed-team-logo': `url(${logoEquipeUrl})` } : {})
  }

  return (
    <>
      <main
        className={`ed-main ${equipe ? `ed-main--pos-${Number(equipe.posicao)} ed-main--cards-${estiloCards}` : ''}`}
        style={equipe ? estiloDaEquipe : undefined}
      >
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
              <h1 className='ed-hero-titulo'>
                {equipe.nome} - TOP {equipe.posicao} do mundo
              </h1>
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
              const selecionado = jogadorSelecionado
              return (
                <section className='ed-secao'>
                  <h2 className='ed-secao-titulo'>Jogadores</h2>
                  <div className='ed-elenco-layout'>
                    <div className='ed-jogadores-grid'>
                    {jogadores.map((membro, idx) => {
                      const j = membro.jogador
                      const funcao = membro.funcaoNaEquipe || j?.funcao || ''
                      const bandeira = codigoParaBandeira(j?.codigoBandeira)
                      return (
                        <button
                          key={idx}
                          className={`ed-jogador-card ${selecionado === membro ? 'ed-jogador-card--ativo' : ''}`}
                          onClick={() => setJogadorSelecionado(selecionado === membro ? null : membro)}
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
                              {j?.codigoBandeira && (
                                <img
                                  className='ed-bandeira'
                                  src={urlBandeira(j.codigoBandeira)}
                                  alt={j.pais || j.codigoBandeira}
                                  loading='lazy'
                                />
                              )}
                              {j?.nomeIngame}
                            </span>
                          </div>
                          {selecionado === membro && (
                            <div className='ed-jogador-detalhes'>
                              {j?.nomeReal && <p><strong>Nome:</strong> {j.nomeReal}</p>}
                              {j?.idade && <p><strong>Idade:</strong> {j.idade} anos</p>}
                              <p><strong>Função:</strong> {funcao}</p>
                              {j?.pais && (
                                <p className='ed-jogador-local'>
                                  <strong>Nasceu na</strong> {j.pais}
                                  {j?.codigoBandeira && (
                                    <img
                                      className='ed-bandeira'
                                      src={urlBandeira(j.codigoBandeira)}
                                      alt={j.pais}
                                      loading='lazy'
                                    />
                                  )}
                                </p>
                              )}
                              {j?.descricaoCurta && (
                                <p className='ed-jogador-destaque'>{j.descricaoCurta}</p>
                              )}
                              {j?.biografia && (
                                <p className='ed-jogador-bio'>{j.biografia}</p>
                              )}
                            </div>
                          )}
                        </button>
                      )
                    })}
                    </div>

                    {/* Coach */}
                    {coach && (() => {
                      const j = coach.jogador
                      const bandeira = codigoParaBandeira(j?.codigoBandeira)
                      return (
                        <aside className='ed-coach-bloco' aria-label='Coach da equipe'>
                          <span className='ed-coach-titulo'>Coach</span>
                          <button
                            className={`ed-jogador-card ed-jogador-card--coach ${selecionado === coach ? 'ed-jogador-card--ativo' : ''}`}
                            onClick={() => setJogadorSelecionado(selecionado === coach ? null : coach)}
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
                              {j?.codigoBandeira && (
                                <img
                                  className='ed-bandeira'
                                  src={urlBandeira(j.codigoBandeira)}
                                  alt={j.pais || j.codigoBandeira}
                                  loading='lazy'
                                />
                              )}
                              {j?.nomeIngame}
                            </span>
                          </div>
                          {selecionado === coach && (
                            <div className='ed-jogador-detalhes'>
                              {j?.nomeReal && <p><strong>Nome:</strong> {j.nomeReal}</p>}
                              {j?.idade && <p><strong>Idade:</strong> {j.idade} anos</p>}
                              <p><strong>Função:</strong> Coach</p>
                              {j?.pais && (
                                <p className='ed-jogador-local'>
                                  <strong>Nasceu na</strong> {j.pais}
                                  {j?.codigoBandeira && (
                                    <img
                                      className='ed-bandeira'
                                      src={urlBandeira(j.codigoBandeira)}
                                      alt={j.pais}
                                      loading='lazy'
                                    />
                                  )}
                                </p>
                              )}
                              {j?.descricaoCurta && (
                                <p className='ed-jogador-destaque'>{j.descricaoCurta}</p>
                              )}
                              {j?.biografia && (
                                <p className='ed-jogador-bio'>{j.biografia}</p>
                              )}
                            </div>
                          )}
                          </button>
                        </aside>
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
    </>
  )
}

export default EquipeDetalhe
