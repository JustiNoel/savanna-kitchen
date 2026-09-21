import { useState, useRef, useEffect } from 'react';
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
  categories:
    "Grabbys has 5 sections:\n• Food — 50+ African dishes, drinks and snacks\n• Grocery — fresh produce and kitchen staples\n• Shop — household and personal care essentials\n• Spirits — beer, wine and spirits (18+ only)\n• Beauty & Lifestyle — cosmetics, skincare, hair, grooming, plus in-person services you can book directly with the provider\n\nTap any card on the home page to open a section. 🛍️",
  beauty:
    "Beauty & Lifestyle is our newest section! Shop cosmetics, skincare, hair and grooming products, or book an in-person service — every stylist and therapist lists their phone, WhatsApp and email so you can contact them directly and pick a slot. 💅",
  menu:
    "Food has 50+ authentic African dishes — Jollof Rice, Nyama Choma, Pilau, Ugali with Sukuma Wiki, Chapati, Mahamri, fresh juices and more. Use the category filters or Weekly Specials to find what you're craving. 🍽️",
  order:
    "To place an order:\n1. Pick your branch (campus) when asked\n2. Browse a section and tap 'Add to Cart'\n3. Open the cart and confirm your items\n4. Share your delivery location (GPS) and an active phone number\n5. Pay to the M-Pesa account shown for that section and enter your confirmation code\n6. Track your order live until the rider arrives\n\nYou must be signed in to order. 🛒",
  payment:
    "Each section has its own payment account, shown at checkout for the items in your cart — Food, Grocery, Shop, Spirits and Beauty & Lifestyle can each have a different paybill, till or bank account.\n\nPay the exact total by M-Pesa, then type your M-Pesa confirmation code. Your order stays 'pending' until our team confirms the payment. 💳",
  delivery:
    "We deliver to your doorstep around Maseno and our campus branches, usually within minutes. Delivery is a flat KSh 20. You'll need to share your GPS location and an active phone number so the rider can reach you. 🛵",
  branches:
    "Grabbys now serves several campuses across the Nyanza region, and you can choose your branch in the app. Prices, stock and available sections depend on the branch you pick. 🏫",
  loyalty:
    "Our loyalty programme rewards every order:\n• 1 point for every KSh 10 spent\n• 100 points = KSh 50 off\n• 250 points = KSh 150 off\n• 500 points = KSh 350 off\n\nCheck your points on your Profile page. 🎁",
  promo:
    "Got a promo code? Enter it in the cart before paying and the discount applies to your total. Weekly Specials also run discounts of up to 30% on selected items. 🔥",
  tracking:
    "After paying, open your Profile or the order tracker to follow your order live — pending, confirmed, preparing, on the way, delivered. You'll also get alerts as the status changes. 📦",
  reservation:
    "Table reservations are available in the Food section. Fill in your name, date, time and number of guests, add any special requests, and we'll confirm shortly. 📅",
  app: "Grabbys installs on your phone like a normal app. On Android tap the install banner or your browser menu → 'Install app'. On iPhone tap Share → 'Add to Home Screen'. The installed app is faster and can alert you about your order. 📲",
  advertise:
    "Want to advertise your business to our 20,000+ users — for free? Reach the Grabbys admin on +254 752 140 592 (calls and WhatsApp) or email grabbysapp@gmail.com and we'll set you up. 📣",
  hours:
    "We're open:\n• Monday - Friday: 7:00 AM - 10:00 PM\n• Saturday: 8:00 AM - 11:00 PM\n• Sunday: 9:00 AM - 9:00 PM\n(East Africa Time) ⏰",
  location:
    "📍 Grabbys — Maseno, Along Siriba Road, Kisumu, Kenya. We deliver around Maseno and our campus branches.",
  contact:
    "Reach us on +254 752 140 592 — active on calls and WhatsApp — or email grabbysapp@gmail.com. We're also on Facebook, Instagram and X. ☎️",
  account:
    "You need a free account to order. Sign up with your email or continue with Google, then add your phone number on your Profile. Forgot your password? Use the reset link on the sign-in page or contact the admin. 🔐",
  specials:
    "Weekly Specials rotate every week with discounts of up to 30%, and each section has its own deals. Check the Specials strip at the top of a section. 🔥",
  help: "I can help with:\n• Sections: Food, Grocery, Shop, Spirits, Beauty & Lifestyle\n• Placing and tracking orders\n• Payment and M-Pesa codes\n• Delivery, branches and fees\n• Loyalty points and promo codes\n• Reservations, accounts, installing the app\n• Advertising your business free with us\n\nJust ask! 😊",
  default:
    "I'm your Grabbys assistant. Ask me about our sections (Food, Grocery, Shop, Spirits, Beauty & Lifestyle), how to order, payments, delivery, branches, loyalty points, reservations, installing the app, or advertising your business with us for free. 🤗",
};

const getResponse = (message: string): string => {
  const m = message.toLowerCase();

  if (/advertis|promote my|market my|business|vendor|partner/.test(m)) return predefinedResponses.advertise;
  if (/beauty|cosmetic|skincare|hair|salon|barber|makeup|lifestyle|massage|spa/.test(m)) return predefinedResponses.beauty;
  if (/install|pwa|download|home screen|app store/.test(m)) return predefinedResponses.app;
  if (/categor|section|what do you sell|grocery|shop|spirit|drink|alcohol/.test(m)) return predefinedResponses.categories;
  if (/track|status|where is my|rider/.test(m)) return predefinedResponses.tracking;
  if (/pay|mpesa|m-pesa|paybill|till|card|cash|code/.test(m)) return predefinedResponses.payment;
  if (/deliver|fee|shipping|how long|far/.test(m)) return predefinedResponses.delivery;
  if (/branch|campus|university|maseno|nyanza|kisumu/.test(m)) return predefinedResponses.branches;
  if (/promo|coupon|voucher|discount code/.test(m)) return predefinedResponses.promo;
  if (/special|deal|offer/.test(m)) return predefinedResponses.specials;
  if (/loyal|point|reward/.test(m)) return predefinedResponses.loyalty;
  if (/reserv|book a table|table/.test(m)) return predefinedResponses.reservation;
  if (/sign up|log ?in|sign ?in|account|password|register/.test(m)) return predefinedResponses.account;
  if (/order|buy|cart|checkout/.test(m)) return predefinedResponses.order;
  if (/menu|dish|food|eat|meal/.test(m)) return predefinedResponses.menu;
  if (/hour|open|close|time/.test(m)) return predefinedResponses.hours;
  if (/location|address|where are you|find you/.test(m)) return predefinedResponses.location;
  if (/contact|phone|whatsapp|call|email/.test(m)) return predefinedResponses.contact;
  if (/help|hi\b|hello|hey|support/.test(m)) return predefinedResponses.help;

  return predefinedResponses.default;
};

const quickAsks = ['How do I order?', 'Payment options', 'Beauty & Lifestyle', 'Advertise with Grabbys'];

export const AIHelpChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! 👋 I'm your Grabbys assistant. Ask me anything about ordering, payments, delivery or our sections.",
      isBot: true,
      timestamp: new Date(),
    },
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

  const ask = (question: string) => {
    const text = question.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}`, text, isBot: false, timestamp: new Date() },
    ]);
    setInputValue('');
    setIsTyping(true);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now() + 1}`, text: getResponse(text), isBot: true, timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, 350);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') ask(inputValue);
  };

  return (
    <>
      {/* Static floating button */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-md"
            size="icon"
            aria-label="Open the Grabbys assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 left-1/2 z-50 flex h-[70vh] max-h-[520px] w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:left-6 sm:translate-x-0">
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Grabbys Assistant</h3>
                <p className="text-xs opacity-80">Always here to help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              aria-label="Close the assistant"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`flex max-w-[85%] items-start gap-2 ${
                      message.isBot ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        message.isBot ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {message.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.isBot
                          ? 'rounded-tl-none bg-muted text-foreground'
                          : 'rounded-tr-none bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {quickAsks.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 rounded-lg"
                aria-label="Message the Grabbys assistant"
              />
              <Button
                onClick={() => ask(inputValue)}
                size="icon"
                disabled={!inputValue.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIHelpChat;
