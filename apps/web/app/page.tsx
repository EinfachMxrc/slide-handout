import { getSession } from "#/lib/auth/session";
import { LandingNav } from "#/components/landing/nav";
import { AirIntroScene } from "#/components/landing/air-intro-scene";
import { SmoothScroll } from "#/components/landing/smooth-scroll";
import { FeatureTabs } from "#/components/landing/feature-tabs";
import {
  Audiences,
  Features,
  FinalCta,
  Footer,
  HowItWorks,
} from "#/components/landing/sections";

export default async function LandingPage(): Promise<React.ReactElement> {
  const session = await getSession();
  const loggedIn = !!session;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SmoothScroll />
      <LandingNav loggedIn={loggedIn} email={session?.email} />
      <AirIntroScene loggedIn={loggedIn} />
      <FeatureTabs />
      <HowItWorks />
      <Features />
      <Audiences />
      <FinalCta loggedIn={loggedIn} />
      <Footer />
    </div>
  );
}
