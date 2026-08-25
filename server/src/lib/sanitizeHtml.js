// Mesma função de client/lib/sanitizeHtml.js, duplicada de propósito: são dois
// pacotes npm separados (client/ e server/ não são um monorepo com workspace),
// e é pouca lógica pra justificar publicar/linkar um pacote só por isto. Se
// mudar aqui, muda lá também.
//
// Sanitiza o HTML restrito ao que o RichTextEditor do admin realmente produz:
// negrito, itálico e quebra de linha. Allowlist, não bloqueio: qualquer tag
// fora dela é descartada sem deixar rastro, e as permitidas nunca carregam
// atributo — não tem como um "onclick" ou "style" entrar disfarçado de <strong>.
//
// Roda AQUI, na gravação — não só no render do Next — porque é a defesa que
// vale mesmo se um POST/PUT chegar direto na API (sem passar pelo
// RichTextEditor do navegador) e porque salvar já limpo é mais barato que
// limpar em toda visita.
const ALLOWED = new Set(["strong", "b", "em", "i", "br"]);

const ALREADY_ENTITY = /&(?:amp|lt|gt|quot|#39|#x27|nbsp);/;

function sanitizeHtml(html) {
  if (!html) return "";
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
      if (!ALLOWED.has(name)) continue;
      if (name === "br") out += "<br>";
      else out += token.startsWith("</") ? `</${name}>` : `<${name}>`;
    }
  }
  return out;
}

module.exports = sanitizeHtml;
