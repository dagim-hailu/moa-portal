"use client";

import { Hero } from "./Hero";
import { InfoSection } from "./InfoSection";
import { CardGrid } from "./CardGrid";
import { InsightsSection } from "./InsightsCard";
import { ContactSection } from "./ContactSection";
import type { MyApp, PortalAnnouncement } from "../../lib/portal-queries";

type Props = {
  apps: MyApp[];
  announcements: PortalAnnouncement[];
  userName: string;
};

export function PortalHome({ apps, announcements, userName }: Props) {
  const sectorCards = [
    {
      title: "Crop Management",
      description: "Track seasonal yields, regional health, and predict harvest outcomes using our real-time data integration.",
      imageSrc: "https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&q=80&w=800",
      buttonText: "View Dashboard"
    },
    {
      title: "Eco-Initiatives",
      description: "Discover organic farming methods, participate in local reforestation, and access carbon credit info.",
      imageSrc: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800",
      buttonText: "Get Involved"
    },
    {
      title: "Livestock Hub",
      description: "Comprehensive tracking for national poultry and cattle, including vaccine schedules and breeding data.",
      imageSrc: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=800",
      buttonText: "Open Portal"
    }
  ];

  const insights = [
    {
      type: "WHEAT",
      title: "National Yield Forecast",
      description: "Expected +12% increase in Oromia region due to improved irrigation.",
      progress: 85,
      progressLabel: "85% of Target Reached",
      iconClass: "fa-solid fa-wheat-awn",
      color: "var(--primary-green)",
      bgColor: "rgba(46, 163, 84, 0.1)"
    },
    {
      type: "WEATHER",
      title: "Rainfall Pattern",
      description: "Steady precipitation expected for the next 14 days in the central highlands.",
      progress: 60,
      progressLabel: "Optimal Moisture: 60%",
      iconClass: "fa-solid fa-cloud-showers-heavy",
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)"
    }
  ];

  // Map authorized apps to cards if needed, or show them in a separate section
  const appCards = apps.map(app => ({
    title: app.nameEn,
    description: app.descriptionEn || "Access your authorized module.",
    imageSrc: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800", // Default app image
    buttonText: "Open Module",
    onClick: () => window.location.href = app.routePath || "#!"
  }));

  return (
    <div className="bg-[var(--bg-main)] min-h-screen">
      <Hero />
      
      <InfoSection 
        id="info-section"
        title="Bridging Tradition with Technology"
        description={`Welcome back, ${userName}. We provide a seamless interface for supply chain tracking, expert consultations, and regional agricultural management. Join us in cultivating a greener future.`}
        imageSrc="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000"
        buttonText="Learn More"
      />

      <CardGrid 
        title="Explore Key Sectors" 
        cards={sectorCards} 
      />

      {apps.length > 0 && (
        <CardGrid 
          title="Your Digital Workspace" 
          cards={appCards} 
        />
      )}

      <InsightsSection 
        title="Live Crop Insights" 
        insights={insights} 
      />

      <ContactSection />
    </div>
  );
}
