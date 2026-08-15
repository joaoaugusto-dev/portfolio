"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/useSession";
import ProjectsAdmin from "@/components/admin/ProjectsAdmin";
import FilesAdmin from "@/components/admin/FilesAdmin";
import CoursesAdmin from "@/components/admin/CoursesAdmin";
import JourneyAdmin from "@/components/admin/JourneyAdmin";

const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH || "estudio";

const tabs = [
  ["projects", "Projetos", "fa-solid fa-diagram-project"],
  ["courses", "Cursos", "fa-solid fa-graduation-cap"],
  ["journey", "Jornada", "fa-solid fa-route"],
  ["files", "Arquivos", "fa-solid fa-folder-open"],
];

export default function Dashboard() {
  const { supabase, session, loading } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState("projects");

  useEffect(() => {
    if (!loading && !session) router.replace(`/${ADMIN_PATH}`);
  }, [loading, session, router]);

  if (loading || !session) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold sm:text-2xl">Painel</h1>
          <p className="truncate text-xs text-muted">{session.user?.email}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm transition-colors hover:border-accent hover:text-accent-2"
            title="Ver o site"
          >
            <i className="fa-solid fa-up-right-from-square" aria-hidden />
            <span className="ml-2 hidden sm:inline">Ver site</span>
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden />
            <span className="ml-2 hidden sm:inline">Sair</span>
          </button>
        </div>
      </motion.div>

      <div className="mb-8 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-white/10 bg-surface/60 p-1">
        {tabs.map(([value, label, icon]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            data-on={tab === value}
            className="pill flex shrink-0 items-center gap-2 px-4 py-2 text-sm"
          >
            {tab === value && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 -z-10 rounded-lg bg-accent shadow-lg shadow-accent/25"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <i className={icon} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {tab === "projects" && <ProjectsAdmin token={session.access_token} />}
          {tab === "courses" && <CoursesAdmin token={session.access_token} />}
          {tab === "journey" && <JourneyAdmin token={session.access_token} />}
          {tab === "files" && <FilesAdmin token={session.access_token} />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
