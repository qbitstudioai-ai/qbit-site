import { AiChatWidget } from "./components/AiChatWidget";
import { ApproachSection } from "./components/ApproachSection";
import { ContactsSection } from "./components/ContactsSection";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { DirectionsSection } from "./components/DirectionsSection";
import { FAQSection } from "./components/FAQSection";
import { FinalCTASection } from "./components/FinalCTASection";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { PainSection } from "./components/PainSection";
import { ResultsSection } from "./components/ResultsSection";
import { ScenarioArchive } from "./components/ScenarioArchive";
import { SocialSection } from "./components/SocialSection";
import { StructuredDataLd } from "./components/StructuredDataLd";
import { WhyQbitSection } from "./components/WhyQbitSection";
import { useSiteContent } from "./siteContent/useSiteContent";
import { useSiteSettings } from "./siteSettings/SiteSettingsContext";

export function MainSite() {
  const { chatEnabled } = useSiteSettings();
  const copy = useSiteContent();

  return (
    <>
      <StructuredDataLd />
      <a href="#main" className="skip-link">
        {copy.a11y.skipToMain}
      </a>
      <Header />
      <div className="cyber-top">
        <div className="cyber-top__fx" aria-hidden="true">
          <div className="cyber-top__fx-scroll">
            <div className="cyber-top__fx-scroll-track" />
          </div>
        </div>
        <div className="cyber-top__sphere" aria-hidden="true" />
        <Hero />
      </div>
      <main id="main" tabIndex={-1}>
        <PainSection />
        <ScenarioArchive />
        <SocialSection />
        <ResultsSection />
        <DirectionsSection />
        <ApproachSection />
        <WhyQbitSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <div className="cyber-bottom">
        <div className="cyber-bottom__fx" aria-hidden="true">
          <div className="cyber-bottom__fx-scroll">
            <div className="cyber-bottom__fx-scroll-track" />
          </div>
        </div>
        <div className="cyber-bottom__sphere" aria-hidden="true" />
        <ContactsSection />
        <Footer />
      </div>
      <CookieConsentBanner />
      {chatEnabled ? <AiChatWidget /> : null}
    </>
  );
}
