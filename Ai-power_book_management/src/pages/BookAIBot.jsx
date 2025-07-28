import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:8080/api/chat/ask"; // updated for your backend

export default function BookAIBot() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hello! I'm BookAI 🤖. Ask me anything about books, authors, genres, or get reading advice!",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatRef = useRef();

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setError("");
    setMessages(prev => [...prev, { role: "user", content: input }]);
    setLoading(true);
    const userMessage = input;
    setInput("");
    try {
      const url = `${API_URL}?message=${encodeURIComponent(userMessage)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("AI server error");
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: "ai", content: data.response || "Sorry, I didn't get that." }
      ]);
    } catch (err) {
      setError("Failed to connect to AI.");
      setMessages(prev => [
        ...prev,
        { role: "ai", content: "Sorry, something went wrong with the AI server." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[90vh] bg-gradient-to-b from-green-50 to-blue-100 flex flex-col items-center pt-8 px-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-green-200 p-0 flex flex-col min-h-[600px]">
        <div className="px-6 pt-6 pb-4 border-b text-xl font-bold text-green-700">
          BookAIBot <span className="text-sm text-gray-400 ml-2">AI Book Assistant</span>
        </div>
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-blue-50"
          style={{ minHeight: 350 }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "ai" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`rounded-lg px-4 py-2 shadow
                  ${m.role === "ai"
                    ? "bg-green-100 text-green-900"
                    : "bg-blue-600 text-white"
                  }
                  max-w-[80%] text-base
                `}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-green-100 text-green-900 shadow animate-pulse max-w-[80%]">
                BookAI is typing...
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="text-red-500 px-6 pb-2">{error}</div>
        )}
        <form
          onSubmit={sendMessage}
          className="flex items-center border-t px-6 py-4 bg-white rounded-b-2xl"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring focus:ring-green-200 focus:border-green-500 outline-none transition"
            placeholder="Ask BookAIBot anything about books..."
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="ml-4 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
      <div className="mt-2 text-xs text-gray-400">Powered by Telusko BookAI</div>
    </div>
  );
}
