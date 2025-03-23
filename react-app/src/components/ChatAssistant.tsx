import React, { useState, useEffect } from "react";
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
    .replace(/\n/g, '<div class="h-4"></div>');
};

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string; isHtml?: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Add welcome message when chat is opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        role: "bot",
        content: "Hi! Please key in the Pokemon TCG Card ID of the Pokemon card that you're interested in and I will provide you the relevant info. You can obtain the Pokemon TCG Card ID from: <a href='https://pokemoncard.io/' target='_blank' rel='noopener noreferrer' class='text-blue-600 hover:text-blue-800'>pokemoncard.io</a>",
        isHtml: true
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const formatPokemonResponse = (data: PokemonResponse): { content: string; isHtml: boolean } => {
    if (!data || data.error) {
      return { 
        content: data?.error || "No information found for this Pokemon.",
        isHtml: false 
      };
    }

    // Return the formatted description if it exists
    if (data.description) {
      // Format the description with bold variables
      let formattedDescription = data.description
        .replace(/\b(Fire|Water|Grass|Electric|Psychic|Fighting|Darkness|Metal|Dragon|Fairy)\b/g, '**$1**')
        .replace(/\b(\d+)\s*HP\b/g, '**$1 HP**')
        .replace(/\$(\d+\.?\d*)/g, '**$$$1**')
        .replace(/\b(Basic|Stage 1|Stage 2|VMAX|VSTAR|V)\b/g, '**$1**')
        .replace(/\b(Illustration Rare|Secret Rare|Ultra Rare|Rare|Uncommon|Common)\b/g, '**$1**')
        .replace(/\b(\d+)\s*damage\b/g, '**$1 damage**')
        .replace(/\b(\d+)\s*energy\b/g, '**$1 energy**')
        .replace(/\b(Pokemon|Trainer|Supporter|Item|Stadium|Tool)\b/g, '**$1**')
        .replace(/\b(\d{3})\b/g, '**$1**'); // Bold set numbers like 151

      return { 
        content: formatMarkdown(formattedDescription),
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
        pokemon_id: input,
        user_query: "Tell me about this Pokémon card"
      });

      const formattedContent = formatPokemonResponse(response.data);
      const botMessage = { 
        role: "bot", 
        content: formattedContent.content,
        isHtml: formattedContent.isHtml 
      };
      
      // Add follow-up message after the response
      const followUpMessage = {
        role: "bot",
        content: "Is there anything else I can help with?",
        isHtml: false
      };

      setMessages((prevMessages) => [...prevMessages, botMessage, followUpMessage]);
    } catch (error: any) {
      console.error("Error:", error);
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error.response?.status === 422) {
        errorMessage = "Invalid Pokemon TCG Card ID format. Please check the ID and try again.";
      } else if (error.response?.status === 429 || 
          (error.response?.data?.detail && error.response?.data?.detail.includes("rate limit"))) {
        errorMessage = "I'm getting too many requests right now. Please wait a moment and try again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Card not found. Please check the Pokemon TCG Card ID and try again.";
      }
      
      const errorBotMessage = { 
        role: "bot", 
        content: errorMessage,
        isHtml: false
      };

      // Add follow-up message after error
      const followUpMessage = {
        role: "bot",
        content: "Is there anything else I can help with?",
        isHtml: false
      };

      setMessages((prevMessages) => [...prevMessages, errorBotMessage, followUpMessage]);
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
                    className="prose prose-sm max-w-none [&_div.h-4]:h-4 [&_div.h-4]:w-full"
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
              placeholder="Key in Pokemon TCG Card ID..."
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



