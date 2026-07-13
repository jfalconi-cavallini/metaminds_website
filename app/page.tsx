import Navbar from "@/components/Navbar";
import HeroTutoring from "@/components/HeroTutoring";
import PlatformFeatures from "@/components/PlatformFeatures";
import FoundingTeam from "@/components/FoundingTeam";
import PricingComparison from "@/components/PricingComparison";
import ReferralBanner from "@/components/ReferralBanner";
import ResultsShowcase from "@/components/ResultsShowcase";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

export default function Home() {
    return (
        <>
            <Navbar />

            <main className="pt-10">
                <HeroTutoring />
                <PlatformFeatures />
                <FoundingTeam />
                <PricingComparison />
                <ReferralBanner />
                <ResultsShowcase />
                <FAQ />
                <FinalCTA />
                <Footer />
            </main>
        </>
    );
}
