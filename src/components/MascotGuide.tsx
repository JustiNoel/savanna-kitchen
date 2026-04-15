import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Sparkles, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'react-router-dom';

type MascotType = 'chef' | 'grocer' | 'shopper' | 'bartender' | 'general';

interface MascotConfig {
  emoji: string;
  name: string;
  greeting: string;
  tips: string[];
  color: string;
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
  },
};

const getMascotType = (pathname: string): MascotType => {
  if (pathname.startsWith('/food')) return 'chef';
  if (pathname.startsWith('/grocery')) return 'grocer';
  if (pathname.startsWith('/shop')) return 'shopper';
  if (pathname.startsWith('/spirits')) return 'bartender';
  return 'general';
};

const getAIResponse = (message: string, mascotType: MascotType): string => {
  const lower = message.toLowerCase();
  const config = mascotConfigs[mascotType];

  if (lower.includes('menu') || lower.includes('food') || lower.includes('dish'))
    return "We have 50+ authentic African dishes! Browse by category — Kenyan, Nigerian, Ethiopian & more. Try our popular Jollof Rice or Nyama Choma! 🍽️";
  if (lower.includes('order') || lower.includes('cart') || lower.includes('buy'))
    return "To order: Add items to cart → Review cart → Choose payment (M-Pesa, Card, Cash) → Confirm! You'll earn loyalty points too! 🛒";
  if (lower.includes('deliver'))
    return "We deliver within Maseno and surrounding areas! Orders are tracked in real-time. 🚗";
  if (lower.includes('price') || lower.includes('cost') || lower.includes('expensive'))
    return "We offer great value! Check our Weekly Specials for discounts up to 30% off. Use promo codes for extra savings! 💰";
  if (lower.includes('loyalty') || lower.includes('point') || lower.includes('reward'))
    return "Earn 1 point per KSh 10 spent! Redeem: 100pts = KSh 50, 250pts = KSh 150, 500pts = KSh 350 off! ⭐";
  if (lower.includes('hour') || lower.includes('open') || lower.includes('close'))
    return "We're open Mon-Fri 7AM-10PM, Sat 8AM-11PM, Sun 9AM-9PM! ⏰";
  if (lower.includes('location') || lower.includes('where') || lower.includes('address'))
    return "📍 Maseno, Along Siriba Road, Kisumu, Kenya. We deliver locally too!";
  if (lower.includes('reserve') || lower.includes('book') || lower.includes('table'))
    return "Head to the Food page and scroll to 'Book Your Table'! Fill in your details and we'll confirm shortly. 📅";
  if (lower.includes('pay') || lower.includes('mpesa') || lower.includes('card'))
    return "We accept M-Pesa, Visa/Mastercard, Cash on Delivery, and Mobile Money! 💳";
  if (lower.includes('special') || lower.includes('deal') || lower.includes('discount'))
    return "Check our Weekly Specials banner on each category page! New deals rotate weekly! 🔥";
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey'))
    return `${config.greeting}`;
  if (lower.includes('thank'))
    return "You're welcome! Happy to help. Enjoy your experience at Grabbys! 😊🎉";
  if (lower.includes('bye'))
    return "See you soon! Don't forget to check our specials before you go! 👋";
  
  return `Great question! I'm ${config.name} and I'm here to help. You can ask me about our menu, ordering, delivery, loyalty points, payments, or specials! 😊`;
};

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
}

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

  // Floating animation values
  const y = useMotionValue(0);

  // Check if mascot should show on page load
  useEffect(() => {
    const dismissed = sessionStorage.getItem('mascot_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setShowTipBubble(true), 1500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Rotate tips
  useEffect(() => {
    if (!showTipBubble || showChat) return;
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % config.tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showTipBubble, showChat, config.tips.length]);

  // Reset chat on category change
  useEffect(() => {
    setChatMessages([]);
    setCurrentTip(0);
  }, [mascotType]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    setShowChat(false);
    setShowTipBubble(false);
    sessionStorage.setItem('mascot_dismissed', 'true');
  };

  const handleOpenChat = () => {
    setShowTipBubble(false);
    setShowChat(true);
    if (chatMessages.length === 0) {
      setChatMessages([{ id: '1', text: config.greeting, isBot: true }]);
    }
  };

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isBot: false,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(userMsg.text, mascotType);
      setChatMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: response, isBot: true },
      ]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  }, [inputValue, mascotType]);

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 z-40 flex flex-col items-start gap-2" style={{ maxWidth: '380px' }}>
      <AnimatePresence mode="wait">
        {/* Tip bubble */}
        {showTipBubble && !showChat && (
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
                <p className="text-xs text-white/80">Your personal guide</p>
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
            <div className="h-[250px] overflow-y-auto p-3 space-y-3">
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
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-muted-foreground">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    >
                      typing...
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-2 flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="text-sm h-9"
              />
              <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleSendMessage}>
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
        {/* Character body */}
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

          {/* Sparkle effect */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Sparkles className="h-4 w-4 text-accent" />
          </motion.div>
        </motion.div>

        {/* Action buttons next to mascot */}
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
  );
};

export default MascotGuide;
