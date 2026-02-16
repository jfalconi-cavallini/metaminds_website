import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import Programs from "@/components/Programs";
import Founders from "@/components/Founders";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";  // NEW
import DaySchedule from "@/components/DaySchedule";
import CampWeeks from "@/components/CampWeeks";
import Themes from "@/components/Themes";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import RobotBanner from "@/components/robot-banner";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Founders />
      <Programs />
      <Gallery />
      <Testimonials />  {/* NEW */}
      <DaySchedule />
      <CampWeeks />
      <Themes />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
      <BackToTop />
    </main>
  );
}