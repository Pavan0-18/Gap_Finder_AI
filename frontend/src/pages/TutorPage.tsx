import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../services/api";
import { Topic, ChatMessage } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  Bot,
  Send,
  User,
  Sparkles,
  BookOpen,
} from "lucide-react";

export const TutorPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!subjectId) return;

    api.get(`/subjects/${subjectId}/topics`).then((res) => {
      setTopics(res.data);
      if (res.data.length > 0) {
        setSelectedTopicId(res.data[0].id);
      }
    });

    api.get(`/chat-sessions?subject_id=${subjectId}`).then((res) => {
      if (res.data.length > 0) {
        setActiveSessionId(res.data[0].id);
        setMessages(res.data[0].messages || []);
      }
    });
  }, [subjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || !subjectId) return;

    const userMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      role: "USER",
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.post(
        `/subjects/${subjectId}/chat${activeSessionId ? `?session_id=${activeSessionId}` : ""}`,
        {
          content: text,
          topic_id: selectedTopicId || undefined,
        }
      );

      setActiveSessionId(res.data.session_id);
      setMessages((prev) => [...prev, res.data.message]);
    } catch (err: any) {
      console.error("Tutor chat failed", err);
      const errMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "ASSISTANT",
        content: "Sorry, I encountered an error communicating with the grounding service. Please try again.",
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const starterPrompts = [
    "Explain the key difference between Mitosis and Meiosis I simply.",
    "Why do homologous chromosomes separate in Anaphase I while sister chromatids stay bound?",
    "Summarize the stages of cell division from the course text.",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in py-2 flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header with Topic Context Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-slate-200 dark:border-stone-800 shadow-sm shrink-0 backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-stone-100">Topic-Specific AI Academic Tutor</h1>
            <p className="text-xs text-slate-500 dark:text-stone-400">Strictly grounded in your uploaded textbook chapters.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Focus Topic:</span>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-300 dark:border-stone-800 text-slate-800 dark:text-stone-200 text-xs focus:outline-none focus:border-amber-500 max-w-[220px] truncate"
          >
            <option value="">All Subject Topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Scroll Container */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80 dark:bg-stone-950/70 border-slate-200 dark:border-stone-800 transition-colors">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-lg shadow-amber-500/10">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-stone-200">What would you like to review?</h3>
              <p className="text-xs text-slate-600 dark:text-stone-400 max-w-md mx-auto">
                Ask about specific mechanisms, clarify misconceptions from your gap report, or request step-by-step conceptual walkthroughs.
              </p>
            </div>

            <div className="space-y-2 w-full max-w-md pt-2">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 hover:border-amber-500/40 text-xs text-slate-700 dark:text-stone-300 text-left transition-all cursor-pointer flex items-center gap-2.5 group shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 group-hover:rotate-12 transition-transform" />
                  <span className="truncate">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "USER";
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-stone-950 font-bold shadow-md shadow-amber-400/20"
                      : "bg-slate-200 dark:bg-stone-800 text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-stone-700"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs space-y-3 leading-relaxed ${
                    isUser
                      ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-stone-950 font-medium rounded-tr-none shadow-md shadow-amber-400/10"
                      : "bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-slate-800 dark:text-stone-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  <div className="prose prose-slate dark:prose-invert prose-xs max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>

                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-stone-800 space-y-1.5 text-[11px] text-slate-500 dark:text-stone-400">
                      <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block text-[10px]">
                        Verified Sources Cited
                      </span>
                      {m.citations.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 font-mono text-slate-700 dark:text-stone-300"
                        >
                          <div className="text-amber-600 dark:text-amber-400 font-semibold mb-0.5">
                            {c.material_title} {c.page_number ? `(Page ${c.page_number})` : ""}
                          </div>
                          "{c.snippet}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-stone-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-slate-300 dark:border-stone-700">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-xs text-slate-600 dark:text-stone-400 rounded-tl-none flex items-center gap-2 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              <span>Retrieving study passages & synthesizing grounded explanation...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the course materials..."
          className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-800 text-slate-900 dark:text-stone-100 placeholder-slate-400 dark:placeholder-stone-500 text-xs focus:outline-none focus:border-amber-500 shadow-sm transition-colors"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!input.trim()}
          isLoading={isLoading}
          className="px-4 py-3 rounded-xl flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
