import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ArrowLeft, Send, Bot, Plus, Code } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  role: string;
  content: string;
}

export default function AIChat() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "coding">("general");
  const [generalMessage, setGeneralMessage] = useState("");
  const [codingMessage, setCodingMessage] = useState("");
  const [generalChatId, setGeneralChatId] = useState<number | undefined>();
  const [codingChatId, setCodingChatId] = useState<number | undefined>();
  const [generalMessages, setGeneralMessages] = useState<Array<{ role: string; content: any }>>([]);
  const [codingMessages, setCodingMessages] = useState<Array<{ role: string; content: any }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const generalMessagesEndRef = useRef<HTMLDivElement>(null);
  const codingMessagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      const response = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
      setIsStreaming(true);
      setStreamingContent("");
      
      let index = 0;
      const streamInterval = setInterval(() => {
        if (index < response.length) {
          setStreamingContent(response.substring(0, index + 1));
          index++;
        } else {
          clearInterval(streamInterval);
          setIsStreaming(false);
          
          if (activeTab === "general") {
            setGeneralMessages((prev) => [...prev, { role: "assistant", content: response }]);
            setGeneralChatId(data.chatId);
          } else {
            setCodingMessages((prev) => [...prev, { role: "assistant", content: response }]);
            setCodingChatId(data.chatId);
          }
          setStreamingContent("");
        }
      }, 20);
      
      toast.success(`${data.creditsRemaining} credits remaining`);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsStreaming(false);
    },
  });

  const handleSend = () => {
    const message = activeTab === "general" ? generalMessage : codingMessage;
    if (!message.trim()) return;

    if (activeTab === "general") {
      setGeneralMessages((prev) => [...prev, { role: "user", content: message }]);
      chatMutation.mutate({ message, chatId: generalChatId });
      setGeneralMessage("");
    } else {
      setCodingMessages((prev) => [...prev, { role: "user", content: message }]);
      chatMutation.mutate({ message: `[CODING] ${message}`, chatId: codingChatId });
      setCodingMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    generalMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [generalMessages]);

  useEffect(() => {
    codingMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [codingMessages]);

  const currentMessages = activeTab === "general" ? generalMessages : codingMessages;
  const currentMessage = activeTab === "general" ? generalMessage : codingMessage;
  const setCurrentMessage = activeTab === "general" ? setGeneralMessage : setCodingMessage;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">AI Chat</h1>
                <p className="text-sm text-muted-foreground">Chat with AI assistants</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {user?.aiCredits || 0} credits
              </div>
              <Link href="/buy-credits">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Buy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container flex-1 py-8 max-w-4xl flex flex-col">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              activeTab === "general"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Bot className="h-4 w-4" />
            General Assistant
          </button>
          <button
            onClick={() => setActiveTab("coding")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              activeTab === "coding"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Code className="h-4 w-4" />
            Coding Assistant
          </button>
        </div>

        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeTab === "general" ? (
                <>
                  <Bot className="h-5 w-5" />
                  TMP Server AI Assistant
                </>
              ) : (
                <>
                  <Code className="h-5 w-5" />
                  Coding Assistant
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {currentMessages.length === 0 ? (
                <div className="text-center py-12">
                  {activeTab === "general" ? (
                    <>
                      <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Start a conversation with the AI assistant</p>
                      <p className="text-xs text-muted-foreground mt-2">Ask questions, get advice, or chat about anything</p>
                    </>
                  ) : (
                    <>
                      <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Start coding with the AI assistant</p>
                      <p className="text-xs text-muted-foreground mt-2">Get help with code writing, debugging, and optimization</p>
                    </>
                  )}
                </div>
              ) : (
                currentMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {activeTab === "coding" && msg.role === "assistant" ? (
                        <div className="whitespace-pre-wrap font-mono text-sm">{msg.content}</div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isStreaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                    {activeTab === "coding" ? (
                      <div className="whitespace-pre-wrap font-mono text-sm">{streamingContent}<span className="animate-pulse">▊</span></div>
                    ) : (
                      <p className="whitespace-pre-wrap">{streamingContent}<span className="animate-pulse">▊</span></p>
                    )}
                  </div>
                </div>
              )}
              <div ref={activeTab === "general" ? generalMessagesEndRef : codingMessagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={activeTab === "general" ? "Ask me anything..." : "Ask for code help..."}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={chatMutation.isPending || !currentMessage.trim()}
              >
                {chatMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
