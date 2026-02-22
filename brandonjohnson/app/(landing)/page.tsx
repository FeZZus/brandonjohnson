import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import InsightSection from "./components/InsightSection";
import FeaturesSection from "./components/FeaturesSection";
import SignalToActionSection from "./components/SignalToActionSection";
import DifferentiatorSection from "./components/DifferentiatorSection";
import Footer from "./components/Footer";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <InsightSection />
      <FeaturesSection />
      <SignalToActionSection />
      <DifferentiatorSection />
      <Footer />
    </main>
  );
}
