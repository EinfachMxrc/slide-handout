import { getSession } from "#/lib/auth/session";
import { LandingNav } from "#/components/landing/nav";
import { Hero } from "#/components/landing/hero";
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
    <div className="min-h-screen bg-navy-950 text-white">
      <LandingNav loggedIn={loggedIn} email={session?.email} />
      <Hero loggedIn={loggedIn} />
      <HowItWorks />
      <Features />
      <Audiences />
      <FinalCta loggedIn={loggedIn} />
      <Footer />
    </div>
  );
}
