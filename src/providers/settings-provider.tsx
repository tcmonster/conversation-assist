"use client";

import * as React from "react";

const STORAGE_KEY = "conversation-assist.settings.v1";

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

export type SettingsState = {
  models: ModelSettings;
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
  references: [],
  quotes: [],
};

type SettingsContextValue = {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  resetSettings: () => void;
  isHydrated: boolean;
};

const SettingsContext = React.createContext<SettingsContextValue | undefined>(
  undefined
);

function safeParseSettings(raw: string | null): SettingsState | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<SettingsState> & {
      models?: Partial<ModelSettings> & { providerName?: string };
    };
    const { providerName: _legacyProviderName, ...restModels } = parsed?.models ?? {};
    void _legacyProviderName;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      models: { ...DEFAULT_SETTINGS.models, ...restModels },
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

function persistSettings(state: SettingsState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("[settings] Failed to persist settings", error);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] =
    React.useState<SettingsState>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const restored = safeParseSettings(
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(STORAGE_KEY)
    );
    if (restored) {
      setSettings(restored);
    }
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    persistSettings(settings);
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
