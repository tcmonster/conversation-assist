import {
  AiClientError,
  type AiTaskRequest,
  type AiTaskResponse,
} from "./types";

const DEFAULT_TRANSLATION_TEMPERATURE = 0;
const DEFAULT_REPLY_TEMPERATURE = 0.4;

type OpenAIChatResponse = {
  choices: Array<{
    message?: {
      content?: string | null;
    };
    delta?: {
      content?: string | null;
    };
  }>;
};

function buildHeaders(apiKey: string | undefined) {
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }
  return headers;
}

function isMockEndpoint(baseUrl: string | undefined) {
  return !baseUrl || baseUrl.trim().length === 0 || baseUrl.startsWith("mock:");
}

function mockResponse(task: AiTaskRequest["task"], inputText: string): AiTaskResponse {
  if (task === "translate") {
    return {
      content: `[Mock Translation]\n${inputText}`,
    };
  }
  return {
    content: `[Mock Reply]\n${inputText}`,
  };
}

function mapTaskTemperature(task: AiTaskRequest["task"]) {
  if (task === "translate") {
    return DEFAULT_TRANSLATION_TEMPERATURE;
  }
  return DEFAULT_REPLY_TEMPERATURE;
}

function toOpenAiMessages(request: AiTaskRequest) {
  if (request.task === "translate") {
    const { system, user } = request.payload;
    const messages: Array<Record<string, unknown>> = [];
    messages.push({
      role: "system",
      content: system,
    });
    messages.push({
      role: "user",
      content: user,
    });
    return messages;
  }

  const { payload } = request;
  const messages: Array<Record<string, unknown>> = [];
  messages.push({
    role: "system",
    content: payload.system,
  });
  if (payload.history.length > 0) {
    messages.push(
      ...payload.history.map((item) => ({
        role: item.role === "partner" ? "user" : "assistant",
        content: item.content,
      }))
    );
  }
  messages.push({
    role: "user",
    content: JSON.stringify(
      {
        task: payload.task,
        instruction: payload.instruction,
        replyLanguage: payload.replyLanguage,
        tonePrompt: payload.tone.prompt,
        intent: payload.intent,
        context: payload.context,
        history: payload.history,
      },
      null,
      2
    ),
  });
  return messages;
}

export async function invokeAiTask(request: AiTaskRequest): Promise<AiTaskResponse> {
  const { task, config } = request;
  const { baseUrl, apiKey, model, signal } = config;
  const sanitizedBaseUrl = baseUrl?.replace(/\/+$/, "") ?? "";

  if (isMockEndpoint(sanitizedBaseUrl)) {
    if (task === "translate") {
      return mockResponse(task, request.payload.user);
    }
    return mockResponse(task, request.payload.intent ?? "");
  }

  if (!model) {
    throw new AiClientError({
      code: "missing-config",
      message: "模型未配置",
    });
  }

  try {
    const response = await fetch(`${sanitizedBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: buildHeaders(apiKey),
      body: JSON.stringify({
        model,
        temperature: config.temperature ?? mapTaskTemperature(task),
        messages: toOpenAiMessages(request),
      }),
      signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new AiClientError({
        code: "unauthorized",
        message: "模型鉴权失败,请检查 API Key",
      });
    }

    if (response.status === 400) {
      throw new AiClientError({
        code: "bad-request",
        message: "AI 请求参数错误",
        details: await response.json().catch(() => undefined),
      });
    }

    if (response.status >= 500) {
      throw new AiClientError({
        code: "server-error",
        message: "模型服务暂时不可用,请稍后重试",
      });
    }

    if (!response.ok) {
      throw new AiClientError({
        code: "unknown",
        message: `调用模型失败(${response.status})`,
        details: await response.text().catch(() => undefined),
      });
    }

    const data = (await response.json()) as OpenAIChatResponse;
    const choice = data.choices?.[0];
    const content =
      choice?.message?.content ??
      choice?.delta?.content ??
      "[Empty response]";
    return {
      content,
      raw: data,
    };
  } catch (error) {
    if (error instanceof AiClientError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiClientError({
        code: "timeout",
        message: "AI 请求已取消",
      });
    }
    throw new AiClientError({
      code: "network-error",
      message: "网络异常导致 AI 请求失败",
      details: error,
    });
  }
}
