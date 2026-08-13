"use client";

import * as React from "react";

import { PromptInput } from "@/components/ui/ai-chat-input";

export default function Demo() {
  const handleSendMessage = (
    message: string,
    meta: { model: string; effort: string; attachments: File[] }
  ) => {
    console.log("Message Submitted:", message);
    console.log("Submission Meta:", meta);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background"
    >
      <div className="p-4 w-full max-w-lg flex justify-center z-10">
        <PromptInput
          onSubmit={handleSendMessage}
          placeholder="Ask anything..."
        />
      </div>
    </div>
  );
}
