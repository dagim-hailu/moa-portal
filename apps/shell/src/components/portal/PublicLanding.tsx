import { PublicNav } from "../PublicNav";
import { HeroSection } from "../landing/HeroSection";
import { UpdatesSection } from "../landing/UpdatesSection";
import { PartnersSection } from "../landing/PartnersSection";
import { CommunitySection } from "../landing/CommunitySection";
import { TestimonialsSection } from "../landing/TestimonialsSection";
import { PublicFooter } from "../landing/PublicFooter";

export function PublicLanding() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <HeroSection />
      <UpdatesSection />
      <PartnersSection />
      <CommunitySection />
      <TestimonialsSection />
      <PublicFooter />
    </div>
  );
}
