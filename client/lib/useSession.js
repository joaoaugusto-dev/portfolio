"use client";
import { useMemo, useSyncExternalStore } from "react";
import { TOKEN_KEY, login } from "./api";

// JWT do painel (POST /api/auth/login), guardado no localStorage.
// O payload é só lido aqui pra saber se venceu — quem valida de verdade é a API.
const EVENT = "admin-session";

function readToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const { exp } = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (exp * 1000 > Date.now()) return token;
  } catch {}
  localStorage.removeItem(TOKEN_KEY);
  return null;
}

// "storage" avisa das OUTRAS abas (sair numa desloga todas); EVENT, desta.
function subscribe(cb) {
  addEventListener("storage", cb);
  addEventListener(EVENT, cb);
  return () => {
    removeEventListener("storage", cb);
    removeEventListener(EVENT, cb);
  };
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  dispatchEvent(new Event(EVENT));
}

async function signIn(email, password) {
  setToken((await login(email, password)).access_token);
}

const signOut = () => setToken(null);

export function useSession() {
  // No servidor (e na hidratação) não há localStorage: undefined = carregando.
  const token = useSyncExternalStore(subscribe, readToken, () => undefined);
  const session = useMemo(() => (token ? { access_token: token } : token), [token]);
  return { session, loading: session === undefined, signIn, signOut };
}
