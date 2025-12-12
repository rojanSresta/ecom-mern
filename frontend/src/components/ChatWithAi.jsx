import { useState } from 'react';
import { Send } from 'lucide-react';
import { useAiStore } from '../stores/useAiStore.js';

const initialMessage = [        { 
  text: "Hello! This is AI assistant. It gives data of the website like number of available products",
  sender: 'ai' 
}];

const ChatWindow = ({ isOpen, onClose }) => {
  const [inputData, setInputData] = useState("");
  const [messages, setMessages] = useState(initialMessage);

  const {loading, chat} = useAiStore();

  if (!isOpen) return null;

  const handleChatRequest = async (e)=>{
    e.preventDefault();
    if(inputData.trim() === "" || loading) return;
    
    const userMessage = inputData.trim();
    setInputData("");
    setMessages(prev => [...prev, {text: userMessage, sender: 'user'}]);

    const aiMessage = await chat(userMessage);
    setMessages(prev => [...prev, aiMessage]);
  }

  const Message = ({ text, sender, error }) => {
    const isAI = sender === 'ai';
    const bgColor = isAI ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-800';
    const alignment = isAI ? 'self-start' : 'self-end';

    return (
      <div className={`p-2 rounded-xl max-w-[85%] ${bgColor} ${alignment}`}>
        <p className={`text-sm ${error ? 'font-bold text-red-100' : ''}`}>
          {error ? '❌ ' : ''}
          {text}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed bottom-32 right-5 w-80 h-96 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">

      <div className="flex justify-between items-center p-3 bg-emerald-500 text-white rounded-t-xl">
        <h3 className="font-semibold text-lg">🤖 AI Assistant</h3>
        <button 
          onClick={onClose} 
          className="text-2xl font-semibold leading-none opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Close chat window"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50 flex flex-col">
        {messages.map((msg, index) => (
          <Message key={index} text={msg.text} sender={msg.sender} error={msg.error} />
        ))}
        {loading && (
          <div className="self-start p-2 bg-gray-300 text-gray-700 rounded-xl max-w-[85%] text-sm">
            Typing...
          </div>
        )}
      </div>

      <form onSubmit={handleChatRequest} className="p-3 border-t bg-white flex items-center"> 
        <input 
          type="text" 
          placeholder="Type a message..." 
          className="flex-1 p-2 border border-gray-300 rounded-l-full focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-black"
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          disabled={loading}
        />
        
        <button
          type="submit"
          disabled={loading || inputData.trim() === ""}
          className="bg-emerald-500 text-white p-2 rounded-r-full hover:bg-emerald-600 transition-colors ml-[-1px] h-[42px] w-12 flex justify-center items-center disabled:bg-gray-400"
          aria-label="Send message"
        >
          <Send className='pr-1'/>
        </button>
      </form>
    </div>
  );
};

const ChatWithAi = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <ChatWindow isOpen={isOpen} onClose={handleToggle} />

            <button
                onClick={handleToggle}
                className={`fixed bottom-5 right-5 w-24 h-24 rounded-full transition-all duration-500 z-50 focus:outline-none focus:ring-4 focus:ring-emerald-300 
                   shadow-lg hover:shadow-2xl hover:shadow-emerald-500/70 hover:scale-105 
                   ${isOpen ? 'ring-4 ring-emerald-500/80 scale-105' : 'bg-transparent'}`}
                aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
            >
                <img
                    className="w-full h-full object-cover rounded-full"
                    src="ai.png"
                    alt="AI chat icon"
                />
            </button>
        </>
    );
};

export default ChatWithAi;