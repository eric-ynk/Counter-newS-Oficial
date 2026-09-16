import "../inicio/inicio.css";
import "./noticia.css";
import { useParams, Link } from "react-router";
import { useEffect, useState } from "react";
import { PortableText } from "@portabletext/react";
import client from "../sanity";
import { postBySlugQuery, relatedPostsQuery } from "../queries";
import { useAuth } from "../Authcontext";
import { useConfig } from "../useConfig";
import { Clock } from "lucide-react";
import Engajamento from "../engajamento";
import "../scroll.css";
import Comentarios from "../comentarios";

const PALAVRAS_POR_MINUTO = 200;

function calcularTempoLeitura(body) {
  if (!Array.isArray(body)) return 1;
  const palavras = body
    .filter((bloco) => bloco._type === "block")
    .map((bloco) => (bloco.children || []).map((c) => c.text).join(" "))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}

const ptComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.imageUrl) return null;
      return (
        <img
          src={value.imageUrl}
          alt={value.alt || ""}
          className="noticia-img-corpo"
        />
      );
    },
  },
};

function Noticia() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relacionadas, setRelacionadas] = useState([]);
  const [times, setTimes] = useState([]);
  const { user } = useAuth();
  const config = useConfig();
  const favoritos = config.timesFavoritos || [];

  useEffect(() => {
    window.scrollTo(0, 0);

    client
      .fetch(postBySlugQuery, { slug })
      .then(setPost)
      .catch((err) => console.error("Erro ao buscar notícia:", err));

    client
      .fetch(relatedPostsQuery, { slug })
      .then((data) => setRelacionadas(data || []))
      .catch((err) => console.error("Erro notícias relacionadas:", err));

    client
      .fetch(
        '*[_type=="equipe"]|order(posicao asc){nome,"slug":slug.current,"logoUrl":logo.asset->url,posicao}'
      )
      .then((data) => setTimes(data || []))
      .catch((err) => console.error("Erro equipes:", err));
  }, [slug]);

  if (!post) return <p className="noticia-carregando">Carregando...</p>;

  const tempoLeitura = calcularTempoLeitura(post.body);
  const timesFavoritos = times.filter((t) => favoritos.includes(t.slug));

  return (
    <article className="noticia-page">
      <div className="noticia-hero">
        <img src={post.imageUrl} alt={post.title} />
        {post.category && (
          <span className="noticia-categoria-pill">{post.category}</span>
        )}
      </div>

      <div className="noticia-layout">
        <div className="noticia-conteudo">
          <h1>{post.title}</h1>

          <div className="noticia-meta">
            <span>{post.authorCredit}</span>
            <span className="ponto">•</span>
            <span>
              {new Date(post.publishedAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "America/Sao_Paulo",
              })}
            </span>
            <span className="ponto">•</span>
            <span className="noticia-tempo">
              <Clock size={14} aria-hidden="true" /> {tempoLeitura} min de
              leitura
            </span>
          </div>

          <Engajamento slug={post.slug} modo="completo" tamanho="grande" />

          <div className="noticia-corpo">
            {Array.isArray(post.body) && post.body.length > 0 ? (
              <PortableText value={post.body} components={ptComponents} />
            ) : (
              <p className="noticia-sem-corpo">Conteúdo completo em breve.</p>
            )}
          </div>

          <section id="comentarios" className="noticia-comentarios">
            <h2 className="sidebar-titulo">Comentários</h2>
            <Comentarios slug={post.slug} />
          </section>
        </div>

        <aside className="noticia-sidebar">
          {relacionadas.length > 0 && (
            <section>
              <h2 className="sidebar-titulo">Notícias relacionadas</h2>
              <div className="relacionadas-lista">
                {relacionadas.map((r) => (
                  <Link
                    to={`/noticia/${r.slug}`}
                    key={r._id}
                    className="relacionada-card"
                  >
                    <img src={r.imageUrl} alt={r.title} />
                    <div>
                      <p className="relacionada-titulo">{r.title}</p>
                      <span className="relacionada-credito">
                        {r.authorCredit}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="sidebar-titulo">Seus times favoritos</h2>
            {!user ? (
              <p id="secao-login">
                <Link to="/login" style={{ color: "inherit" }}>
                  Faça login
                </Link>
                <span>para acompanhar seus times favoritos</span>
              </p>
            ) : timesFavoritos.length === 0 ? (
              <p className="fav-vazio">
                Você ainda não escolheu times favoritos.{" "}
                <Link to="/configuracoes" className="fav-vazio-link">
                  Escolha nas configurações
                </Link>
              </p>
            ) : (
              <div className="fav-times fav-times-sidebar">
                {timesFavoritos.map((t) => (
                  <Link
                    key={t.slug}
                    to={`/ranking/${t.slug}`}
                    className="fav-time-card"
                  >
                    {t.logoUrl && (
                      <img
                        src={t.logoUrl}
                        alt={t.nome}
                        className="fav-time-logo"
                      />
                    )}
                    <span className="fav-time-nome">{t.nome}</span>
                    <span className="fav-time-pos">
                      {t.posicao}º no ranking
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </article>
  );
}

export default Noticia;
