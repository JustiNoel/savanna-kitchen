import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MessageCircle, Send, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

type MascotType = 'chef' | 'grocer' | 'shopper' | 'bartender' | 'general';

interface MascotConfig {
  emoji: string;
  name: string;
  greeting: string;
  tips: string[];
  color: string;
  tutorialSteps: TutorialStep[];
}

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const mascotConfigs: Record<MascotType, MascotConfig> = {
  chef: {
    emoji: '👨‍🍳',
    name: 'Chef Grabby',
    greeting: "Jambo! I'm Chef Grabby! Let me guide you through our delicious African dishes! 🍲",
    tips: [
      "Try our Jollof Rice — it's a fan favorite! 🍚",
      "Don't miss our Weekly Specials for great deals! 🔥",
      "Feeling adventurous? Try our spicy Nyama Choma! 🌶️",
      "Book a table for a dine-in experience! 🪑",
      "Earn loyalty points with every food order! 🎁",
    ],
    color: 'from-orange-500 to-red-500',
    tutorialSteps: [
      { target: '[data-tour="weekly-specials"]', title: '🔥 Weekly Specials', description: 'Check here for discounted dishes that rotate every week!', position: 'bottom' },
      { target: '[data-tour="daily-dishes"]', title: '📅 Daily Dishes', description: 'See what\'s freshly prepared and highlighted for today!', position: 'bottom' },
      { target: '[data-tour="menu"]', title: '🍽️ Our Menu', description: 'Browse 50+ authentic African dishes by category!', position: 'top' },
      { target: '[data-tour="reservation"]', title: '🪑 Book a Table', description: 'Reserve your spot for a dine-in experience!', position: 'top' },
    ],
  },
  grocer: {
    emoji: '🧑‍🌾',
    name: 'Farmer Fresh',
    greeting: "Welcome! I'm Farmer Fresh! Let me help you find the freshest groceries! 🥬",
    tips: [
      "Our vegetables are delivered fresh daily! 🥕",
      "Check out bulk deals for great savings! 💰",
      "We have organic options available! 🌿",
      "Need cooking ingredients? Browse by category! 🧅",
      "Stock up on staples — we've got the best prices! 🛒",
    ],
    color: 'from-green-500 to-emerald-600',
    tutorialSteps: [
      { target: '[data-tour="weekly-specials"]', title: '💰 Grocery Deals', description: 'Fresh deals on produce and staples every week!', position: 'bottom' },
      { target: '[data-tour="grocery-items"]', title: '🥬 Fresh Produce', description: 'Browse all our grocery items by category!', position: 'top' },
    ],
  },
  shopper: {
    emoji: '🛍️',
    name: 'Shoppy',
    greeting: "Hey there! I'm Shoppy! Let me help you find amazing products! ✨",
    tips: [
      "New arrivals drop every week! Check them out! 🆕",
      "We have exclusive Kenyan-made products! 🇰🇪",
      "Looking for gifts? Browse our curated picks! 🎁",
      "Free delivery on orders over KSh 2,000! 🚚",
      "Don't forget to use your promo codes! 💳",
    ],
    color: 'from-blue-500 to-purple-600',
    tutorialSteps: [
      { target: '[data-tour="weekly-specials"]', title: '🏷️ Shop Deals', description: 'Grab exclusive discounts on popular items!', position: 'bottom' },
      { target: '[data-tour="shop-items"]', title: '🛒 Browse Products', description: 'Explore our full product catalog!', position: 'top' },
    ],
  },
  bartender: {
    emoji: '🍸',
    name: 'Mixo',
    greeting: "Cheers! I'm Mixo, your spirits guide! Let me help you find the perfect drink! 🥂",
    tips: [
      "Check out our premium whisky collection! 🥃",
      "Try our curated wine selection! 🍷",
      "New craft beers just arrived! 🍺",
      "Perfect pairings: ask me what goes with your meal! 🍽️",
      "Age verification required — must be 18+! 🔞",
    ],
    color: 'from-purple-500 to-pink-600',
    tutorialSteps: [
      { target: '[data-tour="weekly-specials"]', title: '🥂 Spirits Specials', description: 'Premium drinks at special prices this week!', position: 'bottom' },
      { target: '[data-tour="spirits-items"]', title: '🍷 Our Collection', description: 'Browse wines, spirits, beers and more!', position: 'top' },
    ],
  },
  general: {
    emoji: '🧑‍🍳',
    name: 'Grabby',
    greeting: "Welcome to Grabbys! I'm your guide — tap a category to explore, or ask me anything! 🎉",
    tips: [
      "Explore Food, Grocery, Shop & Spirits sections! 🗂️",
      "Sign up to earn loyalty points on every order! ⭐",
      "Join our WhatsApp channel for exclusive updates! 📱",
      "Check out this week's specials for great deals! 🔥",
      "Need help? Just ask me anything! 💬",
    ],
    color: 'from-primary to-accent',
    tutorialSteps: [
      { target: '[data-tour="hero-categories"]', title: '🗂️ Explore Categories', description: 'Tap any card to explore Food, Grocery, Shop or Spirits!', position: 'bottom' },
      { target: '[data-tour="hero-stats"]', title: '📊 Quick Stats', description: 'See what makes Grabbys special at a glance!', position: 'top' },
    ],
  },
};

const getMascotType = (pathname: string): MascotType => {
  if (pathname.startsWith('/food')) return 'chef';
  if (pathname.startsWith('/grocery')) return 'grocer';
  if (pathname.startsWith('/shop')) return 'shopper';
  if (pathname.startsWith('/spirits')) return 'bartender';
  return 'general';
};

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mascot-chat`;

const MascotGuide = () => {
  const location = useLocation();
  const mascotType = getMascotType(location.pathname);
  const config = mascotConfigs[mascotType];

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [showTipBubble, setShowTipBubble] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);

  // Check if mascot should show
  useEffect(() => {
    const dismissed = sessionStorage.getItem('mascot_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setShowTipBubble(true), 1500);
        // Show tutorial for first-time visitors
        const hasSeenTutorial = localStorage.getItem(`grabbys_tutorial_${mascotType}`);
        if (!hasSeenTutorial && config.tutorialSteps.length > 0) {
          setTimeout(() => {
            setShowTutorial(true);
            setTutorialStep(0);
          }, 3000);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Rotate tips
  useEffect(() => {
    if (!showTipBubble || showChat || showTutorial) return;
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % config.tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showTipBubble, showChat, showTutorial, config.tips.length]);

  // Reset on category change
  useEffect(() => {
    setChatMessages([]);
    setCurrentTip(0);
    conversationRef.current = [];
  }, [mascotType]);

  // Highlight tutorial target
  useEffect(() => {
    if (!showTutorial || !config.tutorialSteps[tutorialStep]) {
      setHighlightRect(null);
      return;
    }
    const step = config.tutorialSteps[tutorialStep];
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setHighlightRect(null);
    }
  }, [showTutorial, tutorialStep, mascotType]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    setShowChat(false);
    setShowTipBubble(false);
    setShowTutorial(false);
    sessionStorage.setItem('mascot_dismissed', 'true');
  };

  const handleOpenChat = () => {
    setShowTipBubble(false);
    setShowTutorial(false);
    setShowChat(true);
    if (chatMessages.length === 0) {
      setChatMessages([{ id: '1', text: config.greeting, isBot: true }]);
      conversationRef.current = [{ role: 'assistant', content: config.greeting }];
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isTyping) return;
    const userText = inputValue.trim();
    const userMsg: ChatMessage = { id: Date.now().toString(), text: userText, isBot: false };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    conversationRef.current.push({ role: 'user', content: userText });

    let assistantText = '';
    const assistantId = (Date.now() + 1).toString();

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: conversationRef.current,
          mascotType,
          category: location.pathname,
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Something went wrong' }));
        throw new Error(err.error || 'Failed to get response');
      }

      // Stream the response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              if (!started) {
                setChatMessages((prev) => [...prev, { id: assistantId, text: assistantText, isBot: true }]);
                started = true;
              } else {
                const updatedText = assistantText;
                setChatMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, text: updatedText } : m))
                );
              }
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      conversationRef.current.push({ role: 'assistant', content: assistantText });
    } catch (e) {
      const fallback = `I'm having a little trouble right now, but I'm still here! Ask me about our menu, delivery, loyalty points, or anything else! 😊`;
      setChatMessages((prev) => [...prev, { id: assistantId, text: fallback, isBot: true }]);
      conversationRef.current.push({ role: 'assistant', content: fallback });
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, mascotType, location.pathname, isTyping]);

  const handleTutorialNext = () => {
    if (tutorialStep < config.tutorialSteps.length - 1) {
      setTutorialStep((s) => s + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem(`grabbys_tutorial_${mascotType}`, 'true');
    }
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(`grabbys_tutorial_${mascotType}`, 'true');
  };

  if (isDismissed || !isVisible) return null;

  const currentStep = config.tutorialSteps[tutorialStep];

  return (
    <>
      {/* Tutorial overlay */}
      <AnimatePresence>
        {showTutorial && highlightRect && currentStep && (
          <>
            <motion.div
              key="tutorial-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60]"
              style={{
                background: `radial-gradient(ellipse ${highlightRect.width + 40}px ${highlightRect.height + 40}px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top + highlightRect.height / 2}px, transparent 50%, rgba(0,0,0,0.7) 100%)`,
              }}
              onClick={handleSkipTutorial}
            />
            {/* Highlight border */}
            <motion.div
              key="highlight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[61] pointer-events-none rounded-xl"
              style={{
                top: highlightRect.top - 6,
                left: highlightRect.left - 6,
                width: highlightRect.width + 12,
                height: highlightRect.height + 12,
                border: '3px solid hsl(var(--primary))',
                boxShadow: '0 0 20px hsl(var(--primary) / 0.4)',
              }}
            />
            {/* Tooltip card */}
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: currentStep.position === 'top' ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed z-[62] bg-card border border-border rounded-2xl p-4 shadow-2xl max-w-[300px]"
              style={{
                ...(currentStep.position === 'bottom'
                  ? { top: highlightRect.bottom + 16, left: Math.max(16, highlightRect.left) }
                  : { bottom: window.innerHeight - highlightRect.top + 16, left: Math.max(16, highlightRect.left) }),
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl`}>{config.emoji}</span>
                <h4 className="font-bold text-sm text-foreground">{currentStep.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{currentStep.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {tutorialStep + 1} of {config.tutorialSteps.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleSkipTutorial}>
                    Skip
                  </Button>
                  <Button size="sm" className="text-xs h-7 gap-1" onClick={handleTutorialNext}>
                    {tutorialStep < config.tutorialSteps.length - 1 ? (
                      <>Next <ChevronRight className="h-3 w-3" /></>
                    ) : (
                      "Got it! ✨"
                    )}
                  </Button>
                </div>
              </div>
              {/* Progress dots */}
              <div className="flex gap-1 mt-2 justify-center">
                {config.tutorialSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === tutorialStep ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main mascot container */}
      <div className="fixed bottom-24 left-4 z-40 flex flex-col items-start gap-2" style={{ maxWidth: '380px' }}>
        <AnimatePresence mode="wait">
          {/* Tip bubble */}
          {showTipBubble && !showChat && !showTutorial && (
            <motion.div
              key="tip"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="bg-card border border-border rounded-2xl p-3 shadow-xl ml-2 max-w-[280px]"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{config.tips[currentTip]}</p>
              </div>
              <div className="flex gap-1 mt-2 justify-center">
                {config.tips.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-1 rounded-full transition-colors ${
                      i === currentTip ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Chat window */}
          {showChat && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-[320px] sm:w-[350px] overflow-hidden"
            >
              {/* Chat header */}
              <div className={`bg-gradient-to-r ${config.color} p-3 flex items-center gap-2`}>
                <span className="text-2xl">{config.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{config.name}</p>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                    <p className="text-xs text-white/80">AI-powered • Always here</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => setShowChat(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="h-[280px] overflow-y-auto p-3 space-y-3">
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        msg.isBot
                          ? 'bg-muted text-foreground rounded-bl-sm'
                          : 'bg-primary text-primary-foreground rounded-br-sm'
                      }`}
                    >
                      {msg.isBot ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </motion.div>
                ))}
                {isTyping && chatMessages[chatMessages.length - 1]?.isBot !== true && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick actions */}
              {chatMessages.length <= 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1">
                  {['What\'s on the menu?', 'How do I order?', 'Weekly specials?'].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInputValue(q); }}
                      className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-border p-2 flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="text-sm h-9"
                  disabled={isTyping}
                />
                <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleSendMessage} disabled={isTyping || !inputValue.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot character */}
        <motion.div
          className="flex items-end gap-2 cursor-pointer group"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          onClick={showChat ? undefined : handleOpenChat}
        >
          <motion.div
            className={`relative h-16 w-16 rounded-full bg-gradient-to-br ${config.color} shadow-lg flex items-center justify-center text-3xl select-none`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            layout
          >
            <motion.span
              key={mascotType}
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {config.emoji}
            </motion.span>
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Sparkles className="h-4 w-4 text-accent" />
            </motion.div>
          </motion.div>

          <div className="flex flex-col gap-1 mb-1">
            {!showChat && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full hover:opacity-90 btn-bounce"
                onClick={handleOpenChat}
              >
                <MessageCircle className="h-3 w-3" />
                Chat
              </motion.button>
            )}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={handleDismiss}
            >
              Dismiss
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default MascotGuide;
