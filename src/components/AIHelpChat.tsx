import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const predefinedResponses: Record<string, string> = {
  menu: "Our menu features 50+ authentic African dishes including Jollof Rice, Nyama Choma, Ugali with Sukuma Wiki, and many more! You can browse all dishes in our Menu section. Use the category filters to find exactly what you're craving. 🍽️",
  order: "To place an order:\n1. Browse our menu and click 'Add to Cart'\n2. Review your cart by clicking the cart icon\n3. Proceed to checkout\n4. Choose your payment method (M-Pesa, Card, Cash, or Mobile Money)\n5. Confirm your order!\n\nYou'll earn loyalty points with every order! 🛒",
  reservation: "To make a reservation:\n1. Scroll to the 'Book a Table' section\n2. Fill in your details (name, date, time, guests)\n3. Add any special requests\n4. Submit your booking\n\nWe'll confirm your reservation shortly! 📅",
  loyalty: "Our loyalty program rewards you for every order!\n• Earn 1 point for every KSh 10 spent\n• 100 points = KSh 50 discount\n• 250 points = KSh 150 discount\n• 500 points = KSh 350 discount\n\nYou also earn bonus points for leaving reviews! 🎁",
  payment: "We accept multiple payment methods:\n• M-Pesa - Fast mobile payment\n• Card - Visa/Mastercard\n• Cash on Delivery\n• Mobile Money Transfer\n\nChoose what works best for you! 💳",
  hours: "We're open:\n• Monday - Friday: 7:00 AM - 10:00 PM\n• Saturday: 8:00 AM - 11:00 PM\n• Sunday: 9:00 AM - 9:00 PM\n\nCome visit us anytime! ⏰",
  location: "📍 Savanna Kitchen\nMoi Avenue, Nairobi CBD\nNear Hilton Hotel\n\nWe also offer delivery within Nairobi! 🚗",
  specials: "Check out our Weekly Specials section for amazing discounts on selected dishes! These rotate weekly, so there's always something new to try at a great price! 🔥",
  help: "I can help you with:\n• Menu & dishes\n• Placing orders\n• Making reservations\n• Loyalty points\n• Payment methods\n• Our location & hours\n• Weekly specials\n\nJust ask me anything! 😊",
  default: "I'm here to help! You can ask me about:\n• Our menu and dishes\n• How to place an order\n• Making a reservation\n• Loyalty points program\n• Payment methods\n• Our location and hours\n• Weekly specials\n\nWhat would you like to know? 🤗"
};

const getResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('menu') || lowerMessage.includes('dish') || lowerMessage.includes('food')) {
    return predefinedResponses.menu;
  }
  if (lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('cart')) {
    return predefinedResponses.order;
  }
  if (lowerMessage.includes('reserv') || lowerMessage.includes('book') || lowerMessage.includes('table')) {
    return predefinedResponses.reservation;
  }
  if (lowerMessage.includes('loyal') || lowerMessage.includes('point') || lowerMessage.includes('reward')) {
    return predefinedResponses.loyalty;
  }
  if (lowerMessage.includes('pay') || lowerMessage.includes('mpesa') || lowerMessage.includes('card') || lowerMessage.includes('cash')) {
    return predefinedResponses.payment;
  }
  if (lowerMessage.includes('hour') || lowerMessage.includes('open') || lowerMessage.includes('time') || lowerMessage.includes('close')) {
    return predefinedResponses.hours;
  }
  if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where') || lowerMessage.includes('find')) {
    return predefinedResponses.location;
  }
  if (lowerMessage.includes('special') || lowerMessage.includes('discount') || lowerMessage.includes('offer') || lowerMessage.includes('deal')) {
    return predefinedResponses.specials;
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return predefinedResponses.help;
  }
  
  return predefinedResponses.default;
};

const AIHelpChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! 👋 I'm your Savanna Kitchen assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getResponse(inputValue),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 left-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <motion.span
          className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 left-6 z-50 w-[350px] sm:w-[400px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Savanna Assistant</h3>
                  <p className="text-xs opacity-80">Always here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`flex items-start gap-2 max-w-[85%] ${
                        message.isBot ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.isBot
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {message.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.isBot
                            ? 'bg-muted text-foreground rounded-tl-none'
                            : 'bg-primary text-primary-foreground rounded-tr-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon" disabled={!inputValue.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIHelpChat;
