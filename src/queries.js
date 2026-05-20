export const postPrincipalQuery = `*[_type == "post" && "Destaque" in categories[]->title] | order(publishedAt desc)[0] {
  _id,
  title,
  publishedAt,
  "authorCredit": author->name,
  "imageUrl": mainImage.asset->url
}`;

export const postsQuery = `*[_type == "post" && !("Destaque" in categories[]->title)] | order(publishedAt desc) {
  _id,
  title,
  publishedAt,
  "authorCredit": author->name,
  "imageUrl": mainImage.asset->url
}`;