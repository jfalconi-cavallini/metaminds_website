import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Crumb } from "@/lib/games";
import GamesBreadcrumb from "./GamesBreadcrumb";

export default function GamesShell({
  crumb,
  kicker,
  title,
  lede,
  children,
}: {
  crumb: readonly Crumb[];
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <GamesBreadcrumb items={crumb} />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">{kicker}</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">{lede}</p>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
