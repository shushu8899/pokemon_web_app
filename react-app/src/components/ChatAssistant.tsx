import React, { useState } from "react";
import axios from "axios";
import { IoSend, IoChatbubbleEllipses, IoClose } from "react-icons/io5";

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);

    setInput("");

    try {
      const response = await axios.post("http://localhost:8000/chat", {
        message: input,
      });

      const botMessage = { role: "bot", content: response.data.reply };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition"
          onClick={() => setIsOpen(true)}
        >
          <IoChatbubbleEllipses size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 bg-white shadow-lg rounded-lg flex flex-col border border-gray-300">
          {/* Header */}
          <div className="bg-yellow-400 text-black px-4 py-2 flex justify-between items-center rounded-lg shadow-lg">
            <span>Chat Assistant</span>
            <button onClick={() => setIsOpen(false)}>
              <IoClose size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="p-4 h-80 overflow-y-auto flex flex-col">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 my-1 rounded ${
                  msg.role === "user"
                    ? "bg-yellow-100 self-end"
                    : "bg-gray-200 self-start"
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-2 border border-gray-300 flex">
            <input
              className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600"
              onClick={sendMessage}
            >
              <IoSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;



