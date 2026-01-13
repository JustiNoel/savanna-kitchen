import { useAuth } from '@/context/AuthContext';
import { Sun, Sunrise, Sunset, Moon } from 'lucide-react';

const WelcomeGreeting = () => {
  const { user } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', icon: Sunrise, emoji: '🌅' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', icon: Sun, emoji: '☀️' };
    } else if (hour >= 17 && hour < 21) {
      return { text: 'Good Evening', icon: Sunset, emoji: '🌇' };
    } else {
      return { text: 'Good Night', icon: Moon, emoji: '🌙' };
    }
  };

  const getUserName = () => {
    if (!user) return 'Guest';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guest';
  };

  const greeting = getGreeting();
  const Icon = greeting.icon;
  const userName = getUserName();

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-4 px-4 border-b border-primary/10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{greeting.text}</p>
            <h3 className="font-display text-lg font-semibold">
              Welcome{user ? `, ${userName}` : ''}! {greeting.emoji}
            </h3>
          </div>
        </div>
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span>Ready to explore our menu?</span>
            <span className="text-lg">🍽️</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeGreeting;
