import './guias.css'
import { useState, useEffect, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import client from '../sanity'

const MAPAS = ['Mirage', 'Dust 2', 'Overpass', 'Anubis', 'Inferno', 'Nuke']

// Conteúdo de exemplo (usado enquanto não há guias no Sanity)
const GUIAS_EXEMPLO = [
  { _id: 'ex1', mapa: 'Mirage', titulo: 'Como fazer smoke Janelão?', categoria: 'Smoke' },
  { _id: 'ex2', mapa: 'Mirage', titulo: 'Como fazer smoke Ligação?', categoria: 'Smoke' },
  { _id: 'ex3', mapa: 'Mirage', titulo: 'Como fazer smoke Jungle?', categoria: 'Smoke' },
  { _id: 'ex4', mapa: 'Mirage', titulo: 'Nome de cada posição', categoria: 'Posições' },
  { _id: 'ex5', mapa: 'Mirage', titulo: 'Melhor execução A', categoria: 'Execução' },
]

// Converte um link do YouTube em URL de embed
function youtubeEmbed(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

function Guias() {
  const [guias, setGuias] = useState(null)
  const [mapaAtivo, setMapaAtivo] = useState(MAPAS[0])
  const [abertoId, setAbertoId] = useState(null)

  useEffect(() => {
    client
      .fetch('*[_type=="guia"]|order(ordem asc, _createdAt asc){_id,titulo,mapa,categoria,videoUrl,descricao}')
      .then((data) => setGuias(data && data.length ? data : GUIAS_EXEMPLO))
      .catch(() => setGuias(GUIAS_EXEMPLO))
  }, [])

  // Fecha o card aberto ao trocar de mapa
  useEffect(() => { setAbertoId(null) }, [mapaAtivo])

  const guiasDoMapa = useMemo(
    () => (guias || []).filter((g) => g.mapa === mapaAtivo),
    [guias, mapaAtivo]
  )

  return (
    <main className="guias-main">
      <h1 className="guias-titulo">Guias</h1>
      <p className="guias-sub">Aprenda smokes, flashes, execuções e posições de cada mapa.</p>

      {/* ── Abas de mapas ── */}
      <div className="guias-tabs" role="tablist" aria-label="Mapas">
        {MAPAS.map((mapa) => (
          <button
            key={mapa}
            role="tab"
            aria-selected={mapaAtivo === mapa}
            className={`guias-tab ${mapaAtivo === mapa ? 'guias-tab--ativo' : ''}`}
            onClick={() => setMapaAtivo(mapa)}
          >
            {mapa}
          </button>
        ))}
      </div>

      {/* ── Lista de guias (acordeão) ── */}
      <div className="guias-lista">
        {guias === null ? (
          <p className="guias-estado">Carregando guias…</p>
        ) : guiasDoMapa.length === 0 ? (
          <p className="guias-estado">Ainda não há guias para {mapaAtivo}. Em breve!</p>
        ) : (
          guiasDoMapa.map((guia) => {
            const aberto = abertoId === guia._id
            const embed = youtubeEmbed(guia.videoUrl)
            return (
              <div key={guia._id} className={`guia-card ${aberto ? 'guia-card--aberto' : ''}`}>
                <button
                  className="guia-card-header"
                  aria-expanded={aberto}
                  onClick={() => setAbertoId(aberto ? null : guia._id)}
                >
                  <span className="guia-card-titulo">
                    {guia.categoria && <span className="guia-tagcat">{guia.categoria}</span>}
                    {guia.titulo}
                  </span>
                  <ChevronDown
                    className={`guia-chevron ${aberto ? 'guia-chevron--aberto' : ''}`}
                    size={28}
                    aria-hidden="true"
                  />
                </button>

                {aberto && (
                  <div className="guia-card-corpo">
                    <div className="guia-video">
                      {embed ? (
                        <iframe
                          src={embed}
                          title={guia.titulo}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="guia-video-placeholder">Vídeo</div>
                      )}
                    </div>
                    {guia.descricao && <p className="guia-descricao">{guia.descricao}</p>}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}

export default Guias
