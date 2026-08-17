// texts: mapa key -> {pt, en} vindo do banco (SiteText). Se a chave não
// existir (texto nunca criado no admin, apagado, ou API fora do ar), cai no
// valor que já era hardcoded antes dessa seção virar editável — o site nunca
// fica com um buraco de texto.
export function tx(texts, key, fallbackPt, fallbackEn = fallbackPt) {
  const t = texts?.[key];
  return { pt: t?.pt ?? fallbackPt, en: t?.en ?? fallbackEn };
}
