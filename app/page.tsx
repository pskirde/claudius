"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronRight, Loader2 } from "lucide-react"
import { useState, useCallback, FormEvent, ChangeEvent, ReactNode, JSX } from "react"

// Type definitions
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ApiResponse {
  content: string;
}

interface CodeBlockMatch {
  0: string;
  1: string;
  2: string;
  index?: number;
  input?: string;
  groups?: { [key: string]: string };
}

// API call function with type safety
async function callClaudeAPI(messages: Message[]): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

const formatMessageContent = (content: string): ReactNode[] => {
  // Split the content by code blocks
  const parts: string[] = content.split(/(```.*?\n[\s\S]*?```)/g);

  return parts.map((part: string, index: number) => {
    // Check if this part is a code block
    if (part.startsWith('```') && part.endsWith('```')) {
      // Extract the code and language
      const match: RegExpMatchArray | null = part.match(/```(.*?)\n([\s\S]*?)```/);
      if (match) {
        const [, language, code]: [string, string, string] = match as unknown as [string, string, string];
        return (
          <div key={index} className="my-2">
            <div className="bg-gray-800 rounded-t-lg px-4 py-2 text-xs text-gray-200">
              {language || 'Code'}
            </div>
            <pre className="bg-gray-900 rounded-b-lg p-4 overflow-x-auto">
              <code className="text-sm font-mono text-gray-200">
                {code.trim()}
              </code>
            </pre>
          </div>
        );
      }
    }
    // Return regular text
    return <span key={index}>{part}</span>;
  });
};

export default function Terminal(): JSX.Element {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to the conversation
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage }
    ];
    setMessages(newMessages);

    try {
      // Call Claude API
      const response: ApiResponse = await callClaudeAPI(newMessages);
      
      // Add Claude's response to the conversation
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.content 
      }]);
    } catch (error) {
      console.error('Error:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold tracking-tight">
            My name is Claudius, how can I help you?
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Messages display area */}
          <div className="mb-4 space-y-4">
            {messages.map((message: Message, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary/10 ml-12"
                    : "bg-muted mr-12"
                }`}
              >
                {formatMessageContent(message.content)}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                className="w-full pl-4 pr-20 py-6 text-lg bg-background border rounded-lg"
                placeholder="Ask me a question..."
                value={input}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {isLoading ? "Loading..." : "Send"}
                  </span>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}