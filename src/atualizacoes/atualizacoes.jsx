import './atualizacoes.css'
import '../global.css'
import { Link } from 'react-router'
import { useRef, useState, useEffect } from 'react'
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

function renderTextoAtualizacao(texto) {
  if (!texto) return null

  if (typeof texto === 'string') {
    return <p className='atu-item-texto'>{texto}</p>
  }

  if (!Array.isArray(texto)) return null

  const elementos = []
  let listaAtual = []

  function renderSpans(block) {
    return block.children?.map((span, index) => {
      let conteudo = span.text

      if (span.marks?.includes('strong')) {
        conteudo = <strong>{conteudo}</strong>
      }

      if (span.marks?.includes('em')) {
        conteudo = <em>{conteudo}</em>
      }

      return <span key={span._key || index}>{conteudo}</span>
    })
  }

  function fecharLista() {
    if (listaAtual.length === 0) return
    elementos.push(
      <ul key={`lista-${elementos.length}`} className='atu-item-lista'>
        {listaAtual}
      </ul>
    )
    listaAtual = []
  }

  texto.forEach((block, index) => {
    if (block._type !== 'block') return

    const conteudo = renderSpans(block)

    if (block.listItem === 'bullet') {
      listaAtual.push(<li key={block._key || index}>{conteudo}</li>)
      return
    }

    fecharLista()
    elementos.push(
      <p key={block._key || index} className='atu-item-texto'>
        {conteudo}
      </p>
    )
  })

  fecharLista()

  return <div className='atu-item-conteudo'>{elementos}</div>
}

function Atualizacoes() {
  const { user } = useAuth();  const [atualizacoes, setAtualizacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido] = useState(null) // _id da atualização aberta
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
  return (
    <>
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
                <div key={atu._id} className={`atu-card ${aberto ? 'atu-card--aberto' : 'atu-card--fechado'}`}>

                  {/* Cabeçalho clicável */}
                  <button
                    className='atu-card-header'
                    onClick={() => setExpandido(aberto ? null : atu._id)}
                    aria-expanded={aberto}
                  >
                    <div className='atu-card-header-esquerda'>
                      <span className='atu-badge'>
                        {index === 0 ? 'Saiu no servidor' : formatarData(atu.dataPublicacao)}
                      </span>
                      <h2 className='atu-card-titulo'>{atu.titulo}</h2>
                      {atu.resumo && <p className='atu-card-resumo'>{atu.resumo}</p>}
                    </div>
                    <span className={`atu-chevron ${aberto ? 'atu-chevron--aberto' : ''}`}>
                      ›
                    </span>
                  </button>

                  {/* Conteúdo expandível */}
                  <div
                    className={`atu-card-corpo ${aberto ? 'atu-card-corpo--aberto' : 'atu-card-corpo--fechado'}`}
                    aria-hidden={!aberto}
                  >
                    {aberto && (
                      <div className='atu-card-conteudo'>

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
                                {renderTextoAtualizacao(item.texto)}
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