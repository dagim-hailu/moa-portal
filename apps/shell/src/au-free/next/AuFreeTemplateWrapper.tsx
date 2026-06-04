"use client";

import SettingsProvider from "providers/SettingsProvider";
import ThemeProvider from "providers/ThemeProvider";
import BreakpointsProvider from "providers/BreakpointsProvider";
import SettingsPanelProvider from "providers/SettingsPanelProvider";
import { SessionProvider } from "providers/SessionProvider";
import MainLayout from "layouts/main-layout";

export default function AuFreeTemplateWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>
        <ThemeProvider>
          <BreakpointsProvider>
            <SettingsPanelProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </SettingsPanelProvider>
          </BreakpointsProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SessionProvider>
  );
}
