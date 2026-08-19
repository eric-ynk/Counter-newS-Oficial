import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import client from '../sanity';
import { postBySlugQuery } from '../queries';

function Noticia() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    client.fetch(postBySlugQuery, { slug })
      .then(setPost)
      .catch((err) => console.error("Erro ao buscar notícia:", err));
  }, [slug]);

  if (!post) return <p>Carregando...</p>;

  return (
    <article>
      <img src={post.imageUrl} alt={post.title} />
      <h1>{post.title}</h1>
      <span>Créditos: {post.authorCredit}</span>
      {/* renderizar o corpo da notícia, ex: PortableText se usar rich text */}
    </article>
  );
}

export default Noticia;