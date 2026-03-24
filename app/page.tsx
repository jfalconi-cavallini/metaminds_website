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
import Mentoring from "@/components/Mentoring";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Gallery />
      <Programs />
      <CampWeeks />
      <DaySchedule />
      <Pricing />
      <Founders />
      <Mentoring />
      <FAQ />
      <Footer />
      <BackToTop />
    </main>
  );
}