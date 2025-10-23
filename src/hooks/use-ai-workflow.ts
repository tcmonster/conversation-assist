"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  composeReplyPayload,
  composeTranslationPayload,
  invokeAiTask,
  type ReplyPromptPayload,
} from "@/lib/ai";
import type { ComposeHistorySource } from "@/lib/ai/prompt-composer";
import {
  AiClientError,
  type AiTaskResponse,
} from "@/lib/ai/types";
import { TONE_PROMPTS, type ToneKey } from "@/prompts";
import {
  type Conversation,
  useConversations,
} from "@/providers/conversation-provider";
import { useSettings } from "@/providers/settings-provider";

const DEFAULT_REPLY_LANGUAGE = "match-external";
const DEFAULT_TRANSLATION_TARGET = "中文";
const DEFAULT_TONE_KEY: ToneKey = "concise";

type ReplyResult = {
  rowId: string;
  response: AiTaskResponse;
  payload: ReplyPromptPayload;
};

function buildHistory(
  conversation: Conversation,
  excludeRowId?: string
): ComposeHistorySource {
  const history: ComposeHistorySource = [];
  for (const row of conversation.feed) {
    if (excludeRowId && row.id === excludeRowId) {
      continue;
    }
    const message = row.message;
    if (!message?.content) continue;
    history.push({
      role: message.role === "partner" ? "partner" : "self",
      content: message.content,
      timestamp: message.timestamp,
    });
  }
  return history;
}

function buildContext(
  conversation: Conversation,
  settings: ReturnType<typeof useSettings>["settings"]
) {
  const references = conversation.selectedReferenceIds
    .map((id) => settings.references.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => `${item.title}\n${item.content}`);

  const quotes = conversation.selectedQuoteIds
    .map((id) => settings.quotes.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => `${item.title}\n${item.content}`);

  return {
    references,
    quotes,
  };
}

function resolveReplyLanguage(value: string | undefined): string {
  if (!value || value === "auto") {
    return DEFAULT_REPLY_LANGUAGE;
  }
  return value;
}

function resolveToneKey(value: string | null | undefined): ToneKey {
  if (!value) return DEFAULT_TONE_KEY;
  if (Object.prototype.hasOwnProperty.call(TONE_PROMPTS, value)) {
    return value as ToneKey;
  }
  return DEFAULT_TONE_KEY;
}

export function useAiWorkflow() {
  const { settings } = useSettings();
  const conversations = useConversations();

  const activeConversation = conversations.activeConversation;

  const buildReplyPromptPreview = React.useCallback(
    (options?: { draftIntent?: string }) => {
      if (!activeConversation) {
        throw new Error("当前没有选中的会话");
      }
      const context = buildContext(activeConversation, settings);
      const history = buildHistory(activeConversation);
      const payload = composeReplyPayload({
        message: options?.draftIntent ?? "",
        intent: options?.draftIntent?.trim() ?? null,
        replyLanguage: resolveReplyLanguage(activeConversation.replyLanguage),
        toneKey: resolveToneKey(activeConversation.tonePresetId),
        context,
        history,
      });
      return {
        payload,
        json: JSON.stringify(payload, null, 2),
      };
    },
    [activeConversation, settings]
  );

  const translatePartnerMessage = React.useCallback(
    async (rowId: string) => {
      const conversation = activeConversation;
      if (!conversation) return;
      const targetRow = conversation.feed.find((row) => row.id === rowId);
      if (!targetRow || targetRow.message.role !== "partner") return;
      if (!settings.models.baseUrl || !settings.models.translationModel) {
        conversations.updateMirror(rowId, {
          status: "error",
          error: "未配置翻译模型, 请在设置中填写",
        });
        toast.error("未配置翻译模型", {
          description: "请先在全局设置中填写模型 Base URL 与翻译模型名称",
        });
        return;
      }

      conversations.updateMirror(rowId, {
        status: "loading",
        error: null,
        content: "",
      });

      const prompt = composeTranslationPayload(targetRow.message.content, {
        targetLanguage: DEFAULT_TRANSLATION_TARGET,
      });

      try {
        const response = await invokeAiTask({
          task: "translate",
          payload: prompt,
          config: {
            baseUrl: settings.models.baseUrl,
            apiKey: settings.models.apiKey,
            model: settings.models.translationModel,
          },
        });
        conversations.updateMirror(rowId, {
          content: response.content,
          status: "ready",
          error: null,
        });
      } catch (error) {
        const message =
          error instanceof AiClientError ? error.info.message : "翻译失败";
        conversations.updateMirror(rowId, {
          status: "error",
          error: message,
        });
        toast.error("翻译失败", {
          description: message,
        });
      }
    },
    [activeConversation, conversations, settings]
  );

  const generateReply = React.useCallback(
    async (
      intentRaw: string,
      options?: { rowId?: string }
    ): Promise<ReplyResult | undefined> => {
      const conversation = activeConversation;
      if (!conversation) {
        toast.error("请选择会话后再生成回复");
        return undefined;
      }
      if (!settings.models.baseUrl || !settings.models.replyModel) {
        toast.error("未配置回复模型", {
          description: "请先在全局设置中填写模型 Base URL 与回复模型名称",
        });
        return undefined;
      }

      const inputIntent = intentRaw.trim();
      const history = buildHistory(conversation, options?.rowId);
      const context = buildContext(conversation, settings);
      const toneKey = resolveToneKey(conversation.tonePresetId);
      const replyLanguage = resolveReplyLanguage(conversation.replyLanguage);

      let rowId = options?.rowId ?? "";
      if (options?.rowId) {
        conversations.updateMirror(rowId, {
          status: "loading",
          error: null,
        });
      } else {
        rowId = conversations.addIntentDraft(inputIntent) ?? "";
        if (!rowId) {
          toast.error("创建回复草稿失败");
          return undefined;
        }
        conversations.updateMirror(rowId, {
          status: "loading",
          error: null,
        });
      }

      const existingRow = conversation.feed.find((row) => row.id === rowId);
      const fallbackIntent = existingRow?.mirror?.content?.trim() ?? "";
      const intent = inputIntent.length > 0 ? inputIntent : fallbackIntent;

      const payload = composeReplyPayload({
        message: intent,
        intent,
        replyLanguage,
        toneKey,
        context,
        history,
      });

      try {
        const response = await invokeAiTask({
          task: "reply",
          payload,
          config: {
            baseUrl: settings.models.baseUrl,
            apiKey: settings.models.apiKey,
            model: settings.models.replyModel,
            temperature: 0.6,
          },
        });
        conversations.updateMessage(rowId, response.content, {
          intent: intent || undefined,
        });
        conversations.updateMirror(rowId, {
          status: "ready",
          error: null,
        });
        toast.success("回复已生成");
        return {
          rowId,
          response,
          payload,
        };
      } catch (error) {
        const message =
          error instanceof AiClientError ? error.info.message : "回复生成失败";
        conversations.updateMirror(rowId, {
          status: "error",
          error: message,
        });
        conversations.updateMessage(rowId, "（生成失败）", {
          intent: intent || undefined,
        });
        toast.error("生成回复失败", {
          description: message,
        });
        return undefined;
      }
    },
    [activeConversation, conversations, settings]
  );

  return {
    translatePartnerMessage,
    generateReply,
    buildReplyPromptPreview,
  };
}
