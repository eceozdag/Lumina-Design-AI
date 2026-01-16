
import React, { useState, useRef, useEffect } from 'react';
import { DESIGN_STYLES } from './constants';
import { DesignStyle, ChatMessage, GroundingLink } from './types';
import { generateReimaginedImage, chatWithAssistant } from './services/geminiService';
import CompareSlider from './components/CompareSlider';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(DESIGN_STYLES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Select a style to begin');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        setOriginalImage(readerEvent.target?.result as string);
        setTransformedImage(null);
        setMessages([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReimagine = async (style: DesignStyle) => {
    if (!originalImage) return;
    setIsLoading(true);
    setSelectedStyle(style);
    setStatusMessage(`Crafting your ${style.name} space...`);
    
    const result = await generateReimaginedImage(originalImage, style.prompt);
    if (result) {
      setTransformedImage(result);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `I've reimagined your room in the **${style.name}** style! ${style.description} How do you like it? Tell me if you want to swap furniture, change colors, or find specific items.`,
        timestamp: Date.now()
      }]);
    } else {
      alert("Something went wrong with the transformation. Please try again.");
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isChatLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }]);

    setIsChatLoading(true);

    // If the user asks for a visual edit
    const isVisualEdit = userMessage.toLowerCase().includes('make') || 
                       userMessage.toLowerCase().includes('add') || 
                       userMessage.toLowerCase().includes('change') ||
                       userMessage.toLowerCase().includes('remove');

    if (isVisualEdit && originalImage) {
      setStatusMessage("Updating visualization...");
      setIsLoading(true);
      const newImg = await generateReimaginedImage(originalImage, selectedStyle.prompt, userMessage);
      if (newImg) setTransformedImage(newImg);
      setIsLoading(false);
    }

    const { text, links } = await chatWithAssistant(
      userMessage, 
      messages.map(m => ({ role: m.role, content: m.content }))
    );

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: text,
      timestamp: Date.now()
    }]);
    
    // In a real app, you'd render grounding links separately. For this demo, we can append them or display in a special card.
    if (links.length > 0) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "Here are some items I found for you:\n" + links.map(l => `• [${l.title}](${l.uri})`).join('\n'),
        timestamp: Date.now()
      }]);
    }

    setIsChatLoading(false);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-wand-magic-sparkles text-white"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Lumina<span className="text-indigo-600">Design</span></h1>
          </div>
          <button 
            onClick={() => document.getElementById('file-upload')?.click()}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-full text-sm font-medium transition-all"
          >
            <i className="fa-solid fa-upload mr-2"></i>
            New Room
          </button>
          <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Editor & Styles */}
        <div className="lg:col-span-2 space-y-8">
          {!originalImage ? (
            <div className="aspect-video bg-white rounded-3xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-camera text-zinc-400 text-3xl"></i>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-800">Upload a room photo</h2>
              <p className="text-zinc-500 mt-2 max-w-xs">Our AI will analyze your space and help you reimagine it instantly.</p>
              <button 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Choose Photo
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {transformedImage ? (
                <CompareSlider original={originalImage} transformed={transformedImage} />
              ) : (
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-xl">
                  <img src={originalImage} className="w-full h-full object-cover" alt="Original Room" />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6">
                      <div className="w-12 h-12 border-4 border-indigo-400 border-t-white rounded-full animate-spin mb-4"></div>
                      <p className="text-lg font-medium animate-pulse">{statusMessage}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Styles Carousel */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">Choose a Vibe</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
                  {DESIGN_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleReimagine(style)}
                      disabled={isLoading}
                      className={`flex-shrink-0 group relative overflow-hidden rounded-2xl p-4 transition-all w-40 text-left border-2 ${
                        selectedStyle.id === style.id ? 'border-indigo-600 bg-indigo-50' : 'border-zinc-100 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <i className={`fa-solid ${style.icon} text-2xl mb-3 ${selectedStyle.id === style.id ? 'text-indigo-600' : 'text-zinc-400'}`}></i>
                      <h4 className="font-bold text-zinc-800">{style.name}</h4>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Consultant Chat */}
        <div className="lg:col-span-1 flex flex-col h-[700px] bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-robot text-indigo-600"></i>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 leading-none">Lumina</h3>
              <span className="text-xs text-zinc-500 font-medium">Interior Consultant</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <i className="fa-solid fa-comments text-4xl mb-4 opacity-20"></i>
                <p>Upload a photo and pick a style to start designing with Lumina.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200'
                  }`}>
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 rounded-2xl rounded-tl-none p-3 border border-zinc-200">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-zinc-50 border-t border-zinc-100">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Lumina to change something..."
                disabled={!transformedImage || isChatLoading}
                className="w-full bg-white border border-zinc-300 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isChatLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-30"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 text-center uppercase tracking-widest font-semibold">
              Powered by Gemini 2.5 Flash
            </p>
          </form>
        </div>
      </main>
      
      {/* Sticky Bottom Actions (Mobile) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-xl border border-zinc-200 shadow-2xl rounded-full px-6 py-3 z-50">
        <button 
          onClick={() => document.getElementById('file-upload')?.click()}
          className="p-2 text-zinc-600"
        >
          <i className="fa-solid fa-camera text-xl"></i>
        </button>
        <div className="w-px h-6 bg-zinc-200"></div>
        <button 
          onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center gap-2 text-indigo-600 font-bold"
        >
          <i className="fa-solid fa-comment-dots text-xl"></i>
          <span>Chat</span>
        </button>
      </div>
    </div>
  );
};

export default App;
