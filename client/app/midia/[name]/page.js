import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import MediaImage from "@/components/MediaImage";
import { getMedia } from "@/lib/api";

export async function generateMetadata({ params }) {
  const { name } = await params;
  const media = await getMedia(name).catch(() => null);
  if (!media) return { title: "Mídia não encontrada" };
  // pdf/outros não têm frame nenhum pra tirar prévia — em vez de deixar cair
  // no og:image padrão do site (a minha foto, definida no layout raiz), usa
  // um ícone estático na paleta de cores do site.
  const image =
    media.kind === "image"
      ? media.url
      : media.kind === "video"
        ? media.posterUrl
        : media.kind === "pdf"
          ? "/images/og-pdf.png"
          : "/images/og-file.png";
  return {
    title: `${media.title} | João Augusto de Freitas`,
    description: media.description || undefined,
    openGraph: {
      title: media.title,
      description: media.description || undefined,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: media.title,
      description: media.description || undefined,
      images: image ? [image] : undefined,
    },
  };
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export default async function MediaPage({ params }) {
  const { name } = await params;
  const media = await getMedia(name).catch(() => null);
  if (!media) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-surface shadow-2xl shadow-black/40">
          {media.kind === "image" ? (
            <MediaImage src={media.url} alt={media.title} />
          ) : media.kind === "video" ? (
            <VideoPlayer src={media.url} poster={media.posterUrl} title={media.title} />
          ) : media.kind === "pdf" ? (
            <iframe src={media.url} title={media.title} className="w-full h-[75vh]" />
          ) : (
            <div className="py-20 text-center">
              <i className="fa-solid fa-file text-5xl text-accent-2" aria-hidden />
            </div>
          )}
        </div>

        <h1 className="mb-2 mt-8 text-3xl font-bold">{media.title}</h1>
        <p className="mb-6 text-sm text-muted">Enviado em {formatDate(media.createdAt)}</p>

        {media.description && (
          <div className="rounded-2xl border border-white/5 bg-surface p-6">
            <p className="whitespace-pre-line leading-relaxed text-muted">{media.description}</p>
          </div>
        )}

        <Link
          href="/"
          className="group mt-10 inline-flex items-center gap-2 text-accent-2 transition-colors hover:text-accent"
        >
          <i
            className="fa-solid fa-arrow-left text-xs transition-transform duration-300 group-hover:-translate-x-1"
            aria-hidden
          />
          Voltar ao portfólio
        </Link>
      </main>
      <Footer />
    </>
  );
}
