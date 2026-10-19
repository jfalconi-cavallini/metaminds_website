import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GamesCatalog from "./GamesCatalog";

export const metadata: Metadata = {
  title: "Games | MetaMinds STEM Academy",
  description: "Practice games for MetaMinds students. No login required.",
};

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Practice</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Games</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Short practice games students can open from school. No login required. Choose a grade and a subject.
          </p>
          <GamesCatalog />
        </div>
      </main>
      <Footer />
    </>
  );
}
