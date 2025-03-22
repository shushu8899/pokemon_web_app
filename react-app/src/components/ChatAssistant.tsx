import React, { useState } from "react";
import api from "../services/api";
import { IoSend, IoChatbubbleEllipses, IoClose } from "react-icons/io5";

interface PokemonResponse {
  name?: string;
  supertype?: string;
  subtypes?: string[];
  level?: string;
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  set?: string;
  rarity?: string;
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: string;
  flavorText?: string;
  image_url?: string;
  description?: string;
  error?: string;
}

const formatMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/### (.*?)\n/g, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>')
    .replace(/#### (.*?)\n/g, '<h4 class="text-md font-bold mt-2 mb-1">$1</h4>')
    .replace(/\n/g, '<br/>');
};

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string; isHtml?: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatPokemonResponse = (data: PokemonResponse): { content: string; isHtml: boolean } => {
    if (!data || data.error) {
      return { 
        content: data?.error || "No information found for this Pokemon.",
        isHtml: false 
      };
    }

    // Return the formatted description if it exists
    if (data.description) {
      return { 
        content: formatMarkdown(data.description),
        isHtml: true 
      };
    }

    // Otherwise, create a formatted response
    let formattedResponse = `🎴 **${data.name}** Card Details:\n\n`;
    formattedResponse += `Type: ${data.supertype}\n`;
    formattedResponse += `HP: ${data.hp}\n`;
    formattedResponse += `Set: ${data.set}\n\n`;

    if (data.attacks && data.attacks.length > 0) {
      formattedResponse += "⚔️ Attacks:\n";
      data.attacks.forEach(attack => {
        formattedResponse += `\n${attack.name}\n`;
        formattedResponse += `- Cost: ${attack.cost.join(", ")}\n`;
        formattedResponse += `- Damage: ${attack.damage || "None"}\n`;
        if (attack.text) {
          formattedResponse += `- Effect: ${attack.text}\n`;
        }
      });
      formattedResponse += "\n";
    }

    if (data.weaknesses && data.weaknesses.length > 0) {
      formattedResponse += "⚠️ Weaknesses:\n";
      data.weaknesses.forEach(weakness => {
        formattedResponse += `- ${weakness.type}: ${weakness.value}\n`;
      });
      formattedResponse += "\n";
    }

    if (data.flavorText) {
      formattedResponse += `📝 ${data.flavorText}\n`;
    }

    return { 
      content: formatMarkdown(formattedResponse),
      isHtml: true 
    };
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/rag/fetch", {
        pokemon_name: input,
        user_query: "Tell me about this Pokémon"
      });

      const formattedContent = formatPokemonResponse(response.data);
      const botMessage = { 
        role: "bot", 
        content: formattedContent.content,
        isHtml: formattedContent.isHtml 
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error: any) {
      console.error("Error:", error);
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error.response?.status === 429 || 
          (error.response?.data?.detail && error.response?.data?.detail.includes("rate limit"))) {
        errorMessage = "I'm getting too many requests right now. Please wait a moment and try again.";
      }
      
      setMessages((prevMessages) => [...prevMessages, { 
        role: "bot", 
        content: errorMessage,
        isHtml: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
        <div className="w-96 bg-white shadow-lg rounded-lg flex flex-col border border-black-300">
          {/* Header */}
          <div className="bg-yellow-400 text-black px-4 py-2 flex justify-between items-center rounded-lg shadow-lg">
            <span>Pokemon Chat Assistant</span>
            <button onClick={() => setIsOpen(false)}>
              <IoClose size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="p-4 h-96 overflow-y-auto flex flex-col">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 my-1 rounded ${
                  msg.role === "user"
                    ? "bg-yellow-100 self-end"
                    : "bg-gray-200 self-start"
                } max-w-[90%]`}
              >
                {msg.isHtml ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                    className="prose prose-sm max-w-none [&_br]:leading-[1.0] [&_br]:content-[''] [&_br]:block [&_br]:mt-0"
                  />
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {isLoading && (
              <div className="bg-gray-200 self-start p-2 my-1 rounded">
                Thinking...
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-2 border border-gray-300 flex">
            <input
              className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about Pokemon..."
              disabled={isLoading}
            />
            <button
              className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:bg-gray-400"
              onClick={sendMessage}
              disabled={isLoading}
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



