export type ToneKey = "concise" | "business" | "casual";

export const TRANSLATION_PROMPT = {
  system: [
    "You are a bilingual assistant who translates and summarizes messages.",
    "Always produce clear, natural output in the target language.",
  ].join(" "),
  template: [
    "Please translate the following message into {{TARGET_LANGUAGE}}.",
    "Make the response concise and keep only essential information.",
    "Remove redundant phrases, greetings that add no value, and unrelated details.",
    "",
    "Message:",
    "{{CONTENT}}",
  ].join("\n"),
};

export const REPLY_PROMPT = {
  system: [
    "You are a professional communication assistant.",
    "Craft context-aware replies that align with the provided intent and tone prompt.",
    "Always respect the reply language requirement.",
  ].join(" "),
  instruction: [
    "Given the JSON payload, craft a single reply message.",
    "Use the history to understand the conversation flow (partner = sender, self = user).",
    "Incorporate reference and quote materials when relevant.",
    "Follow the tonePrompt exactly.",
    "Return only the reply text.",
  ].join(" "),
};

export const TONE_PROMPTS: Record<
  ToneKey,
  {
    label: string;
    prompt: string;
  }
> = {
  concise: {
    label: "简洁",
    prompt:
      "Keep the reply short, direct, and focused on key points. Avoid unnecessary embellishment.",
  },
  business: {
    label: "商务礼貌",
    prompt:
      "Write in a professional and courteous tone suitable for business communication. Maintain clarity and respect.",
  },
  casual: {
    label: "随意口语",
    prompt:
      "Use a relaxed, friendly tone with natural conversational phrasing. Mild slang is acceptable if appropriate.",
  },
};

export function buildTranslationPrompt(content: string, targetLanguage = "中文") {
  return {
    system: TRANSLATION_PROMPT.system,
    user: TRANSLATION_PROMPT.template
      .replace("{{TARGET_LANGUAGE}}", targetLanguage)
      .replace("{{CONTENT}}", content),
  };
}
