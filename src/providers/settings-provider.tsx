"use client";

import * as React from "react";

import { createStorageSlot } from "@/lib/storage";

export type ModelSettings = {
  baseUrl: string;
  apiKey: string;
  translationModel: string;
  replyModel: string;
};

export type ReferenceItem = {
  id: string;
  title: string;
  content: string;
};

export type QuoteItem = {
  id: string;
  title: string;
  content: string;
};

export type SyncSettings = {
  githubToken: string;
  githubUsername: string;
  githubRepo: string;
};

export type SettingsState = {
  models: ModelSettings;
  sync: SyncSettings;
  references: ReferenceItem[];
  quotes: QuoteItem[];
};

export const DEFAULT_SETTINGS: SettingsState = {
  models: {
    baseUrl: "",
    apiKey: "",
    translationModel: "",
    replyModel: "",
  },
  sync: {
    githubToken: "",
    githubUsername: "",
    githubRepo: "",
  },
  references: [],
  quotes: [],
};

const SETTINGS_STORAGE = createStorageSlot<SettingsState>({
  key: "conversation-assist.settings.v1",
  parser: (raw) => safeParseSettings(raw),
});

type SettingsContextValue = {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  resetSettings: () => void;
  isHydrated: boolean;
};

const SettingsContext = React.createContext<SettingsContextValue | undefined>(
  undefined
);

function safeParseSettings(raw: string): SettingsState | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<SettingsState> & {
      models?: Partial<ModelSettings> & { providerName?: string };
      sync?: Partial<SyncSettings>;
    };
    const { providerName: _legacyProviderName, ...restModels } = parsed?.models ?? {};
    void _legacyProviderName;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      models: { ...DEFAULT_SETTINGS.models, ...restModels },
      sync: { ...DEFAULT_SETTINGS.sync, ...parsed.sync },
      references: Array.isArray(parsed?.references)
        ? parsed.references
        : DEFAULT_SETTINGS.references,
      quotes: Array.isArray(parsed?.quotes)
        ? parsed.quotes
        : DEFAULT_SETTINGS.quotes,
    };
  } catch (error) {
    console.error("[settings] Failed to parse settings from localStorage", error);
    return undefined;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] =
    React.useState<SettingsState>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const restored = SETTINGS_STORAGE.read();
    if (restored) {
      setSettings(restored);
    }
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    SETTINGS_STORAGE.write(settings);
  }, [settings, isHydrated]);

  const resetSettings = React.useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      settings,
      setSettings,
      resetSettings,
      isHydrated,
    }),
    [settings, resetSettings, isHydrated]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
