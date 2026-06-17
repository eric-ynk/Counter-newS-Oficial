import './atualizacoes.css'
import '../global.css'
import { Link } from 'react-router'
import { useRef, useState, useEffect } from 'react'
import LogoHeader from '../assets/Logo menor.png'
import { useAuth } from '../Authcontext'
import client from '../sanity'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(client)
function urlFor(source) {
  return builder.image(source).url()
}

const atualizacoesQuery = `*[_type == "atualizacao"] | order(dataPublicacao desc) {
  _id,
  titulo,
  resumo,
  dataPublicacao,
  imagemDestaque,
  secoes[] {
    tituloSecao,
    imagem,
    itens[] {
      subtitulo,
      texto,
      imagem
    }
  }
}`

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-')
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia))
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatarDataLonga(dataStr) {
  const [ano, mes, dia] = dataStr.split('-')
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia))
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function Atualizacoes() {
  const { user, loadingAuth, logout } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [atualizacoes, setAtualizacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido] = useState(null) // _id da atualização aberta
  const menuRef = useRef(null)

  const hoje = new Date()
  const tituloData = hoje.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  useEffect(() => {
    client.fetch(atualizacoesQuery)
      .then(data => {
        setAtualizacoes(data)
        // Abre a mais recente por padrão
        if (data.length > 0) setExpandido(data[0]._id)
        setCarregando(false)
      })
      .catch(err => { console.error('Erro ao buscar atualizações:', err); setCarregando(false) })
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

  return (
    <>
      <header className='cabecalho'>
        <Link to="/"><img src={LogoHeader} alt="Logo" id='logo' /></Link>
        <nav className='links'>
          <ul>
            <li className='lista-nav'><Link to="/">Notícias</Link></li>
            <li className='lista-nav'><Link to="/competitivo">Competitivo</Link></li>
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

      <main className='atu-main'>
        <h1 className='atu-titulo-pagina'>Atualizações — {tituloData}</h1>

        {carregando ? (
          <p className='atu-estado'>Carregando atualizações...</p>
        ) : atualizacoes.length === 0 ? (
          <p className='atu-estado'>Nenhuma atualização encontrada.</p>
        ) : (
          <div className='atu-lista'>
            {atualizacoes.map((atu, index) => {
              const aberto = expandido === atu._id
              return (
                <div key={atu._id} className={`atu-card ${aberto ? 'atu-card--aberto' : ''}`}>

                  {/* Cabeçalho clicável */}
                  <button
                    className='atu-card-header'
                    onClick={() => setExpandido(aberto ? null : atu._id)}
                    aria-expanded={aberto}
                  >
                    <div className='atu-card-header-esquerda'>
                      <span className='atu-badge'>
                        {index === 0 ? 'Mais recente' : formatarData(atu.dataPublicacao)}
                      </span>
                      <h2 className='atu-card-titulo'>{atu.titulo}</h2>
                      {atu.resumo && <p className='atu-card-resumo'>{atu.resumo}</p>}
                    </div>
                    <span className={`atu-chevron ${aberto ? 'atu-chevron--aberto' : ''}`}>
                      ›
                    </span>
                  </button>

                  {/* Conteúdo expandível */}
                  {aberto && (
                    <div className='atu-card-corpo'>

                      {/* Imagem de destaque */}
                      {atu.imagemDestaque && (
                        <img
                          src={urlFor(atu.imagemDestaque)}
                          alt={atu.titulo}
                          className='atu-imagem-destaque'
                        />
                      )}

                      {/* Seções */}
                      {atu.secoes?.map((secao, si) => (
                        <div key={si} className='atu-secao'>
                          <h3 className='atu-secao-titulo'>
                            <span className='atu-secao-bracket'>[</span>
                            {secao.tituloSecao}
                            <span className='atu-secao-bracket'>]</span>
                          </h3>

                          {secao.imagem && (
                            <img
                              src={urlFor(secao.imagem)}
                              alt={secao.tituloSecao}
                              className='atu-imagem-secao'
                            />
                          )}

                          <ul className='atu-itens'>
                            {secao.itens?.map((item, ii) => (
                              <li key={ii} className='atu-item'>
                                {item.subtitulo && (
                                  <span className='atu-item-subtitulo'>{item.subtitulo}</span>
                                )}
                                <p className='atu-item-texto'>{item.texto}</p>
                                {item.imagem && (
                                  <img
                                    src={urlFor(item.imagem)}
                                    alt={item.subtitulo || ''}
                                    className='atu-imagem-item'
                                  />
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

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

export default Atualizacoes