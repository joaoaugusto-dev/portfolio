// Substitui o public/sitemap.xml estático, que tinha dois problemas: lastmod
// fixo em 2026-07-10 (envelhecia sozinho, e a home muda toda vez que o admin
// edita) e uma segunda URL /?lang=en que serve HTML idêntico ao da home — o
// inglês é troca no cliente. Duas URLs com o mesmo conteúdo no sitemap é o
// Google escolhendo qual ignorar. Aqui sobra a home, e o lastmod acompanha a
// regeneração da página.
export default function sitemap() {
  return [
    {
      url: "https://www.joaoaugusto.dev/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
