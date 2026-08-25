// Sanitiza o HTML restrito ao que o RichTextEditor do admin realmente produz:
// negrito, itálico e quebra de linha (ver components/admin/RichTextEditor.js —
// só tem os botões bold/italic). Allowlist, não bloqueio: qualquer tag fora dela
// é descartada sem deixar rastro, e as permitidas nunca carregam atributo — não
// tem como um "onclick" ou "style" entrar disfarçado de <strong>.
//
// Isso troca um isomorphic-dompurify (que carrega jsdom pra rodar fora do
// browser) que já derrubou a regeneração da home em produção DUAS VEZES com
// crash de interop ESM/CJS numa dependência transitiva do jsdom — primeiro
// html-encoding-sniffer, depois whatwg-url -> @exodus/bytes. Nenhuma das duas
// é do DOMPurify em si, é sempre o jsdom por baixo. Pra um HTML tão restrito
// quanto este, não vale carregar esse parser inteiro nem apostar que a próxima
// dependência transitiva dele não quebra de novo.
const ALLOWED = new Set(["strong", "b", "em", "i", "br"]);

// Entidades que o próprio navegador já grava no innerHTML (ex.: "Tom &amp; Jerry").
// Sem essa exceção, rodar isso de novo em cima de um valor já salvo dobraria a
// entidade a cada edição: "&amp;" virando "&amp;amp;".
const ALREADY_ENTITY = /&(?:amp|lt|gt|quot|#39|#x27|nbsp);/;

export default function sanitizeHtml(html) {
  if (!html) return "";
  // Três alternativas, nessa ordem, cobrindo TODO caractere da entrada — nenhum
  // "<" sai sem passar por uma delas: tag reconhecida, texto sem "<", ou um "<"
  // solto (tag malformada) que a última alternativa pega e a linha de baixo escapa.
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|[^<]+|</g;
  let out = "";
  let m;
  while ((m = re.exec(html))) {
    const token = m[0];
    if (token === "<") {
      out += "&lt;";
    } else if (m[1] === undefined) {
      out += token.replace(/&/g, (amp, i) => (ALREADY_ENTITY.test(token.slice(i)) ? amp : "&amp;"));
    } else {
      const name = m[1].toLowerCase();
      if (!ALLOWED.has(name)) continue; // fora da allowlist: some, conteúdo interno vira texto no próximo match
      if (name === "br") out += "<br>"; // sempre auto-fechada, nunca "</br>"
      else out += token.startsWith("</") ? `</${name}>` : `<${name}>`;
    }
  }
  return out;
}
