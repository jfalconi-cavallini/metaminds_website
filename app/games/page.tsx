import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { games } from "@/lib/games";

export const metadata: Metadata = {
  title: "Games | MetaMinds STEM Academy",
  description:
    "Free practice games for MetaMinds students. No login required.",
};

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Practice
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Games</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Short practice games students can open from school. No login required.
          </p>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <li key={game.slug} className="h-full">
                <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                      {game.subject}
                    </span>
                    <span className="rounded-xl bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {game.gradeRange}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{game.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-gray-600">{game.description}</p>
                  <Link
                    href={game.href}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                  >
                    Play
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
