export const postPrincipalQuery = `*[_type == "post" && "Destaque" in categories[]->title] | order(publishedAt desc)[0] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  "authorCredit": author->name,
  "imageUrl": mainImage.asset->url
}`;

export const postsQuery = `*[_type == "post"] | order(publishedAt desc){
  _id,
  title,
  "slug": slug.current,
  "imageUrl": mainImage.asset->url,
  "authorCredit": author->name,
  publishedAt
}`

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  "imageUrl": mainImage.asset->url,
  "authorCredit": author->name,
  publishedAt,
  "category": categories[0]->title,
  body[]{
    ...,
    _type == "image" => {
      "imageUrl": asset->url
    }
  }
}`

export const relatedPostsQuery = `*[_type == "post" && slug.current != $slug] | order(publishedAt desc)[0...4]{
  _id,
  title,
  "slug": slug.current,
  "imageUrl": mainImage.asset->url,
  "authorCredit": author->name,
  publishedAt
}`