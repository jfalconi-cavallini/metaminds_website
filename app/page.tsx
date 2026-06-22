import Navbar from "@/components/Navbar";
import HeroTutoring from "@/components/HeroTutoring";
import ResultsShowcase from "@/components/ResultsShowcase";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import WhyMetaMinds from "@/components/WhyMetaMinds";
import FAQ from "@/components/FAQ";

export default function Home() {
    return (
        <>
            <Navbar />

            <main className="pt-10">
                <HeroTutoring />
                <ResultsShowcase />
                <FAQ />
                <FinalCTA />
                <Footer />
            </main>
        </>
    );
}