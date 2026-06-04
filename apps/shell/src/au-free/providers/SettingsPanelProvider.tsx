"use client";

import { PropsWithChildren, createContext, use, useState } from 'react';

export interface SettingsPanelConfig {
  showSettingPanelButton: boolean;
  openSettingPanel: boolean;
}

interface SettingsPanelContextInterFace {
  settingsPanelConfig: SettingsPanelConfig;
  setSettingsPanelConfig: (config: Partial<SettingsPanelConfig>) => void;
}

export const SettingsPanelContext = createContext({} as SettingsPanelContextInterFace);

const SettingsPanelProvider = ({ children }: PropsWithChildren) => {
  const [settingsPanelConfig, setSettingsPanelConfig] = useState<SettingsPanelConfig>({
    showSettingPanelButton: true,
    openSettingPanel: false,
  });

  return (
    <SettingsPanelContext.Provider
      value={{
        settingsPanelConfig,
        setSettingsPanelConfig: (config: Partial<SettingsPanelConfig>) =>
          setSettingsPanelConfig((prev) => ({ ...prev, ...config })),
      }}
    >
      {children}
    </SettingsPanelContext.Provider>
  );
};

export default SettingsPanelProvider;

export const useSettingsPanelContext = () => use(SettingsPanelContext);
