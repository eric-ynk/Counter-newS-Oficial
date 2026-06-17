import './competitivo.css'
import '../global.css'
import { Link } from 'react-router'
import { useRef, useState, useEffect } from 'react'
import LogoHeader from '../assets/Logo menor.png'
import { useAuth } from '../Authcontext'
import client from '../sanity'
import imageUrlBuilder from '@sanity/image-url'

// Builder para gerar URLs das imagens do Sanity
const builder = imageUrlBuilder(client)
function urlFor(source) {
  return builder.image(source).url()
}

// Query: busca competições com data de fim >= hoje, ordenadas por data de início
const competicoesQuery = `*[_type == "competicao" && dataFim >= $hoje] | order(dataInicio asc) {
  _id,
  nome,
  logo,
  local,
  online,
  dataInicio,
  dataFim,
  premioTotal
}`

function formatarPremio(valor) {
  return `U$ ${valor.toLocaleString('en-US')}`
}

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-')
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia))
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getMes(dataStr) {
  const [ano, mes] = dataStr.split('-')
  const data = new Date(Number(ano), Number(mes) - 1, 1)
  const nomeMes = data.toLocaleDateString('pt-BR', { month: 'long' })
  return nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)
}

function agruparPorMes(competicoes) {
  const grupos = {}
  competicoes.forEach(comp => {
    const chave = comp.dataInicio.slice(0, 7)
    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push(comp)
  })
  return grupos
}

function estaAcontecendo(dataInicio, dataFim) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicio = new Date(dataInicio + 'T00:00:00')
  const fim = new Date(dataFim + 'T00:00:00')
  return hoje >= inicio && hoje <= fim
}

function CardCompeticao({ comp }) {
  return (
    <div className='comp-card'>
      <div className='comp-card-topo'>
        <div className='comp-card-esquerda'>
          {comp.logo
            ? <img src={urlFor(comp.logo)} alt={comp.nome} className='comp-logo' />
            : <div className='comp-logo-placeholder'>CS</div>
          }
          <span className='comp-nome'>{comp.nome}</span>
        </div>
        <span className='comp-local'>{comp.online ? 'Online' : comp.local}</span>
      </div>
      <div className='comp-card-info'>
        <span className='comp-datas'>
          {formatarData(comp.dataInicio)} — {formatarData(comp.dataFim)}
        </span>
        <span className='comp-premio'>
          {formatarPremio(comp.premioTotal)} em prêmios totais
        </span>
      </div>
    </div>
  )
}

function Competitivo() {
  const { user, loadingAuth, logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [competicoes, setCompeticoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const menuRef = useRef(null)

  const hoje = new Date()
  const tituloData = hoje.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  useEffect(() => {
    const hojeISO = new Date().toISOString().slice(0, 10)
    client.fetch(competicoesQuery, { hoje: hojeISO })
      .then(data => { setCompeticoes(data); setCarregando(false) })
      .catch(err => { console.error('Erro ao buscar competições:', err); setCarregando(false) })
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

  const agora = competicoes.filter(c => estaAcontecendo(c.dataInicio, c.dataFim))
  const futuras = competicoes.filter(c => !estaAcontecendo(c.dataInicio, c.dataFim))
  const gruposFuturos = agruparPorMes(futuras)

  return (
    <>
      <header className='cabecalho'>
        <Link to="/"><img src={LogoHeader} alt="Logo" id='logo' /></Link>
        <nav className='links'>
          <ul>
            <li className='lista-nav'><Link to="/">Notícias</Link></li>
            <li className='lista-nav'><Link to="/atualizacoes">Atualizações</Link></li>
            <li className='lista-nav'><a href="#">Ranking</a></li>
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

      <main className='comp-main'>
        <h1 className='comp-titulo'>Competições — {tituloData}</h1>

        {carregando ? (
          <p className='comp-carregando'>Carregando competições...</p>
        ) : competicoes.length === 0 ? (
          <p className='comp-vazio'>Nenhuma competição encontrada.</p>
        ) : (
          <>
            {agora.length > 0 && (
              <section className='comp-secao'>
                <h2 className='comp-secao-titulo'>Acontecendo agora</h2>
                {agora.map(comp => <CardCompeticao key={comp._id} comp={comp} />)}
              </section>
            )}

            {Object.entries(gruposFuturos).map(([chave, comps]) => {
              const [ano] = chave.split('-')
              const nomeMes = getMes(comps[0].dataInicio)
              const anoAtual = new Date().getFullYear()
              const label = Number(ano) === anoAtual ? `Em ${nomeMes}` : `Em ${nomeMes} ${ano}`
              return (
                <section key={chave} className='comp-secao'>
                  <h2 className='comp-secao-titulo'>{label}</h2>
                  {comps.map(comp => <CardCompeticao key={comp._id} comp={comp} />)}
                </section>
              )
            })}
          </>
        )}
      </main>
    </>
  )
}

export default Competitivo