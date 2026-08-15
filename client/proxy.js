import { NextResponse } from "next/server";

// Nome real da rota (pasta app/estudio). Fica fixo — só a URL pública que aponta
// pra ele muda, via NEXT_PUBLIC_ADMIN_PATH no .env.
const INTERNAL = "estudio";

export function proxy(req) {
  const adminPath = (process.env.NEXT_PUBLIC_ADMIN_PATH || INTERNAL).replace(/^\/+|\/+$/g, "");
  const { pathname } = req.nextUrl;

  // Path customizado configurado: o nome interno "estudio" para de responder,
  // pra alguém adivinhando a rota óbvia não achar nada.
  if (adminPath !== INTERNAL && (pathname === `/${INTERNAL}` || pathname.startsWith(`/${INTERNAL}/`))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname === `/${adminPath}` || pathname.startsWith(`/${adminPath}/`)) {
    const rest = pathname.slice(`/${adminPath}`.length);
    return NextResponse.rewrite(new URL(`/${INTERNAL}${rest}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
