"use client";
import { useEffect, useState } from "react";
import { createClient } from "./supabaseClient";

export function useSession() {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  return { supabase, session, loading: session === undefined };
}
