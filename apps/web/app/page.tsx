import { LandingNav } from "#/components/landing/nav";
import { Hero } from "#/components/landing/hero";
import {
  Audiences,
  Features,
  FinalCta,
  Footer,
  HowItWorks,
} from "#/components/landing/sections";

export default function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <Audiences />
      <FinalCta />
      <Footer />
    </div>
  );
}
