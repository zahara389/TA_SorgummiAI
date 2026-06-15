import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  PanelLeft, 
  HelpCircle, 
  X, 
  Bot, 
  User, 
  Mic, 
  Send,
  MoreVertical,
  Pin,
  Trash2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BrandBot from '../components/BrandBot';
import { UserProfile } from '../services/authService';
import { 
  createChatSession, 
  saveChatMessage, 
  fetchChatSessions,
  fetchChatMessages,
  deleteChatSession,
  pinChatSession,
  uploadFile,
  ChatSession as FireChatSession,
  ChatMessage as FireChatMessage
} from '../services/dataService';
import { toast } from 'sonner';

interface ChatSession {
  id: string;
  title: string;
  time: string;
  pinned?: boolean;
  created_at?: string;
}

interface ChatAIProps {
  isOpen: boolean;
  userProfile?: UserProfile | null;
  onClose: () => void;
  prefilledMessage?: string;
}

const ChatAI: React.FC<ChatAIProps> = ({ isOpen, userProfile, onClose, prefilledMessage }) => {
  const INITIAL_MESSAGES = [
    { 
      id: 'welcome', 
      text: "Halo! 👋 Saya asisten virtual Anda. Ada yang bisa saya bantu hari ini?", 
      sender: 'bot' as const,
      createdAt: { seconds: Date.now() / 1000 }
    }
  ];

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chat sessions
  const loadSessions = async () => {
    if (!userProfile?.id) return;
    const fireChats = await fetchChatSessions(userProfile.id);
    if (Array.isArray(fireChats)) {
      const sorted = fireChats.map((c: any) => ({
        id: c.id!,
        title: c.title,
        time: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...',
        pinned: !!c.pinned,
        created_at: c.created_at
      })).sort((a: any, b: any) => {
        // Pinned first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setChats(sorted);
    }
  };

  useEffect(() => {
    setActiveChatId(null);
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setShowWelcome(true);
    loadSessions();
  }, [userProfile?.id]);

  // Handle outside click for action menu
  useEffect(() => {
    const handleOutsideClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteChatSession(id);
      toast.success("Riwayat obrolan dihapus");
      if (activeChatId === id) {
        setMessages([]);
        setActiveChatId(null);
      }
      loadSessions();
    } catch (err) {
      toast.error("Gagal menghapus obrolan");
    }
    setActiveActionMenuId(null);
  };

  const handlePinSession = async (e: React.MouseEvent, id: string, currentlyPinned: boolean) => {
    e.stopPropagation();
    try {
      await pinChatSession(id, !currentlyPinned);
      toast.success(!currentlyPinned ? "Obrolan disematkan" : "Sematkan dilepas");
      loadSessions();
    } catch (err) {
      toast.error("Gagal menyematkan obrolan");
    }
    setActiveActionMenuId(null);
  };

  const handleShareSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const shareLink = `${window.location.origin}/chat/${id}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Link obrolan disalin ke clipboard");
    setActiveActionMenuId(null);
  };

  // Load messages when session changes
  const loadMessages = async () => {
    if (!activeChatId) {
      setMessages(INITIAL_MESSAGES);
      return;
    }

    const fireMsgs = await fetchChatMessages(activeChatId);
    if (Array.isArray(fireMsgs) && fireMsgs.length > 0) {
      setMessages(fireMsgs.map((m: any) => ({
        id: m.id,
        text: m.message,
        sender: m.sender,
        file_url: m.file_url,
        time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...',
      })));
    } else {
      setMessages(INITIAL_MESSAGES);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Request microphone permission when chat opens to prompt the user early
  useEffect(() => {
    if (!isOpen) return;
    if (navigator && (navigator as any).mediaDevices && (navigator as any).mediaDevices.getUserMedia) {
      (navigator as any).mediaDevices.getUserMedia({ audio: true })
        .then(() => console.log('[Chat Frontend] Microphone permission granted'))
        .catch((err: any) => console.warn('[Chat Frontend] Microphone permission denied or error:', err));
    } else {
      console.warn('[Chat Frontend] getUserMedia not supported in this browser');
    }
  }, [isOpen]);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const startListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!SpeechRecognition) {
      alert("Browser tidak mendukung microphone");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Mic error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    if (isOpen && prefilledMessage) {
      setInput(prefilledMessage);
      // Optional: Auto-focus the input
    }
  }, [isOpen, prefilledMessage]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    let chatId = activeChatId;

    // Create new session if none active
    if (!chatId && userProfile?.id) {
      const session = await createChatSession(userProfile.id, messageText.substring(0, 30));
      if (session && session.id) {
        chatId = session.id;
        setActiveChatId(chatId);
        loadSessions(); // Refresh sidebar
      }
    }

    if (!chatId) return;

    // Optimistic user UI
    const newUserMsg = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setIsTyping(true);

    try {
      console.log("[Chat Frontend] Sending message:", messageText);
      const response = await saveChatMessage(chatId, messageText, userProfile?.email);
      console.log("[Chat Frontend] Response from saveChatMessage:", response);

      // Support multiple backend response shapes
      // 1) { message: '...' } (current messages.php)
      // 2) { reply: '...' } (some /api/chat implementations)
      // 3) { text: '...' } (generic)
      const replyText = response?.message ?? response?.reply ?? response?.text ?? (response?.data && (response.data.message || response.data.reply)) ?? null;

      if (replyText) {
        const botMsg = {
          id: response.id || Math.random().toString(36).substr(2, 9),
          text: replyText,
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        console.error("[Chat Frontend] Invalid response format (no reply found):", response);
        toast.error("Gagal terhubung ke AI - format response salah");
        // Remove user message if AI failed
        setMessages(prev => prev.filter(m => m.id !== newUserMsg.id));
      }
    } catch (e: any) {
      console.error("[Chat Frontend] Error:", e.message || e);
      toast.error(`Gagal terhubung ke AI: ${e.message || "Kesalahan tidak diketahui"}`);
      // Remove user message if AI failed
      setMessages(prev => prev.filter(m => m.id !== newUserMsg.id));
    } finally {
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setActiveChatId(null);
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setIsTyping(false);
  };

  const SidebarItem = ({ id, title, time, isActive, pinned }: any) => (
    <div 
      onClick={() => setActiveChatId(id)}
      className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-white/10 text-white shadow-lg' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 px-1">
        {pinned && <Pin className="w-2.5 h-2.5 text-brand-accent shrink-0" />}
        <span className="text-[12px] font-medium truncate">{title}</span>
      </div>
      
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="text-[9px] font-bold text-gray-600 group-hover:text-gray-400 transition-colors uppercase">{time}</span>
        
        <div className="relative inline-block text-left">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveActionMenuId(activeActionMenuId === id ? null : id);
            }}
            className="p-1 rounded-md hover:bg-white/10 text-gray-500 hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {activeActionMenuId === id && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl bg-[#1a2b23] border border-white/10 overflow-hidden z-[60]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  type="button"
                  onClick={(e) => handlePinSession(e, id, !!pinned)}
                  className="flex items-center w-full px-4 py-2.5 text-[11px] font-bold text-gray-300 hover:bg-white/5 gap-3 transition-colors"
                >
                  <Pin className="w-3.5 h-3.5" />
                  {pinned ? 'Lepas Sematkan' : 'Sematkan Obrolan'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleShareSession(e, id)}
                  className="flex items-center w-full px-4 py-2.5 text-[11px] font-bold text-gray-300 hover:bg-white/5 gap-3 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Kirim Link Obrolan
                </button>
                <div className="h-px bg-white/5 mx-2 my-1" />
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(e, id)}
                  className="flex items-center w-full px-4 py-2.5 text-[11px] font-bold text-red-400 hover:bg-red-400/10 gap-3 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Riwayat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const filteredChats = chats.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-0 bottom-0 left-0 right-0 z-[100] flex bg-[#0c1410] overflow-hidden font-sans">
          {/* Welcome Greeting Animation Overlay */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 z-[110] bg-white flex flex-col items-center justify-center p-10"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2
                  }}
                  className="w-24 h-24 bg-brand-accent rounded-3xl flex items-center justify-center p-4 mb-8 shadow-[0_20px_50px_rgba(163,255,18,0.3)]"
                >
                  <Bot className="w-12 h-12 text-brand-primary" />
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tighter">Halo, {userProfile?.name?.split(' ')[0] || 'User'}!</h2>
                  <p className="text-gray-500 font-medium text-lg">Sorgummi AI siap membantu Anda hari ini.</p>
                </motion.div>

                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: 120 }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="h-1 bg-brand-accent/30 rounded-full mt-10 overflow-hidden"
                >
                  <motion.div 
                    animate={{ x: [-120, 120] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-1/2 h-full bg-brand-accent"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <motion.div 
            initial={false}
            animate={{ 
              width: isSidebarVisible ? 260 : 0,
              x: isSidebarVisible ? 0 : -260,
              opacity: isSidebarVisible ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-[#0c1410] text-gray-300 flex flex-col border-r border-white/5 shrink-0 h-full relative z-10 overflow-hidden pt-[84px]"
          >
            <div className="w-[260px] flex flex-col h-full px-3 py-4">
              <button 
                type="button"
                onClick={resetChat}
                className="flex items-center justify-center gap-3 w-full p-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-[13px] font-semibold text-white transition-all mb-6 shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Obrolan Baru
              </button>

              <div className="relative mb-6 px-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari obrolan..." 
                  className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-[12px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-white/10 transition-all font-medium"
                />
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-3">TERAKHIR</h3>
                {filteredChats.map((chat) => (
                  <SidebarItem 
                    key={chat.id}
                    id={chat.id}
                    isActive={activeChatId === chat.id} 
                    title={chat.title} 
                    time={chat.time} 
                    pinned={chat.pinned}
                  />
                ))}
                {filteredChats.length === 0 && (
                  <p className="px-3 py-2 text-[11px] text-gray-600 italic">Tidak ada obrolan ditemukan</p>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img 
                      src={userProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.email || 'user'}`} 
                      alt="User" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-white truncate text-left">{userProfile?.name || 'User'}</h4>
                    <p className="text-[9px] text-[#86d60f] font-black uppercase tracking-[0.15em] opacity-90 text-left">
                      {userProfile?.role === 'admin' ? 'SYSTEM ADMIN' : 'PREMIUM MEMBER'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chat Body */}
          <div className="flex-1 flex flex-col bg-[#fdfdfd] relative h-full overflow-hidden pt-[84px]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                  className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <PanelLeft className={`w-5 h-5 transition-transform ${!isSidebarVisible ? 'rotate-180 text-brand-primary' : ''}`} />
                </button>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Sorgummi AI</h2>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[9px] text-green-600 font-bold uppercase tracking-wider">Online</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors active:scale-90 bg-gray-50 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
              <div className="w-full">
                {messages.map((msg, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    key={msg.id} 
                    className={`w-full py-6 ${msg.sender === 'bot' ? 'bg-gray-50/40 border-y border-gray-100/30' : 'bg-transparent'}`}
                  >
                    <div className={`max-w-3xl mx-auto px-6 flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center border overflow-hidden ${msg.sender === 'bot' ? 'bg-brand-accent text-brand-primary border-brand-accent shadow-sm' : 'bg-gray-800 text-white border-gray-800 shadow-sm'}`}>
                        {msg.sender === 'bot' ? (
                          <Bot className="w-3.5 h-3.5" />
                        ) : (
                          userProfile?.avatar ? (
                            <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )
                        )}
                      </div>
                      
                      <div className={`flex-1 min-w-0 pt-0.5 flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`text-[13px] leading-relaxed max-w-[85%] prose prose-sm prose-p:my-0 whitespace-pre-wrap ${
                          msg.sender === 'bot' 
                            ? 'text-gray-700' 
                            : 'bg-brand-primary text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-sm'
                        }`}>
                          {msg.text}

                          {msg.steps && (
                            <div className="mt-4 space-y-3">
                              {msg.steps.map((step: string, idx: number) => (
                                <div key={idx} className="flex gap-3 items-start group">
                                  <div className={`w-4.5 h-4.5 rounded flex items-center justify-center text-[9px] font-bold shrink-0 shadow-xs ${
                                    msg.sender === 'bot' ? 'bg-white border border-gray-200 text-brand-primary' : 'bg-white/20 text-white'
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  <p className={`text-[12.5px] font-medium leading-relaxed ${msg.sender === 'bot' ? 'text-gray-600' : 'text-white/90'}`}>{step}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {msg.quickActions && msg.sender === 'bot' && (
                          <div className="flex flex-wrap gap-2.5 mt-6 pt-6 border-t border-gray-100/50 w-full">
                            {msg.quickActions.map((action: string, idx: number) => (
                              <button 
                                key={idx} 
                                type="button"
                                onClick={() => handleSend(action)}
                                className="bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-[11px] font-bold hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent/5 transition-all shadow-xs"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="w-full py-6 bg-gray-50/40 border-y border-gray-100/30">
                    <div className="max-w-3xl mx-auto px-6 flex items-start gap-4">
                      <div className="w-7 h-7 rounded-lg bg-brand-accent text-brand-primary flex items-center justify-center shadow-sm">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex gap-1.5 pt-2">
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="h-40" />
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/80 to-transparent pt-12 pb-6 px-6 z-30">
              <div className="max-w-3xl mx-auto w-full relative">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus-within:border-brand-accent/50 focus-within:ring-4 ring-brand-accent/5 transition-all flex items-end p-1.5 pr-2.5">
                  <div className="mb-0.5">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={startListening}
                        className={`p-2.5 transition-colors rounded-xl ${isListening ? 'bg-green-50 text-green-500 animate-pulse' : 'text-gray-400 hover:text-brand-accent hover:bg-gray-50'}`}
                      >
                        <Mic className={`w-4.5 h-4.5 ${isListening ? 'text-green-500' : ''}`} />
                      </button>
                      {isListening && <span className="text-green-500 text-sm font-medium">Mendengarkan...</span>}
                    </div>
                  </div>
                  <textarea 
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Apa yang bisa saya bantu hari ini?"
                    className="flex-1 bg-transparent py-3 px-2 text-[14px] focus:outline-none resize-none min-h-[44px] max-h-48 font-medium text-gray-700 placeholder:text-gray-400 scrollbar-hide"
                  />
                  <div className="flex items-center gap-2 mb-0.5 ml-2">
                    <button 
                      type="button"
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-95 ${input.trim() ? 'bg-brand-primary text-white hover:shadow-brand-accent/20' : 'bg-gray-50 text-gray-200 shadow-none'}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] opacity-40">
                   <span>Sorgummi Intelligence v2.4</span>
                   <span className="w-1 h-1 bg-gray-300 rounded-full" />
                   <span>End-to-End Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatAI;
