"use client";

import { Chat as ChatComponent } from "@/components/ui/chat";
import { useChat } from "@ai-sdk/react";
import { getTokenCached } from "@/app/actions/auth";
import { client } from "@/lib/client";

interface ChatProps {
  companyId: number;
}

export function Chat({ companyId }: ChatProps) {
  // Configure the chat hook with custom API endpoint
  const { messages, input, handleInputChange, handleSubmit, append, stop, isLoading, setMessages } =
    useChat({
      api: client.ai.chat.$url().toString(),
      body: {
        companyId
      },
      fetch: async (url, options) => {
        const headers = new Headers(options?.headers);
        const token = await getTokenCached();
        headers.set("Authorization", `Bearer ${token}`);

        return fetch(url, { ...options, headers });
      },
      maxSteps: 3,
      sendExtraMessageFields: true,
    });

  return (
    <ChatComponent
      className="grow h-full"
      messages={messages}
      handleSubmit={handleSubmit}
      input={input}
      handleInputChange={handleInputChange}
      isGenerating={isLoading}
      stop={stop}
      append={append}
      suggestions={[
        "How much revenue did we make last year?",
        "Delay the chat for 3 seconds",
        "What is the ratio between our net income and AR? What does this signify?",
        "What is the weather in toronto?",
      ]}
      setMessages={setMessages}
    />
  );
}
