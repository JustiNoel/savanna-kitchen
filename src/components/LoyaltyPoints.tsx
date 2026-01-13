import { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, History, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface LoyaltyData {
  points: number;
  total_earned: number;
  total_redeemed: number;
}

interface Transaction {
  id: string;
  points: number;
  type: 'earn' | 'redeem';
  source: string;
  description: string;
  created_at: string;
}

const DISCOUNT_TIERS = [
  { points: 100, discount: 5, label: '5% Off' },
  { points: 250, discount: 10, label: '10% Off' },
  { points: 500, discount: 15, label: '15% Off' },
  { points: 1000, discount: 25, label: '25% Off' },
];

const LoyaltyPoints = () => {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
      fetchTransactions();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setLoyaltyData(data);
    } else if (!data) {
      // Create initial loyalty record if doesn't exist
      const { data: newData, error: insertError } = await supabase
        .from('loyalty_points')
        .insert({ user_id: user.id, points: 0, total_earned: 0, total_redeemed: 0 })
        .select()
        .single();
      
      if (!insertError && newData) {
        setLoyaltyData(newData);
      }
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
  };

  const getNextTier = () => {
    if (!loyaltyData) return DISCOUNT_TIERS[0];
    return DISCOUNT_TIERS.find(tier => tier.points > loyaltyData.points) || DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1];
  };

  const getCurrentTier = () => {
    if (!loyaltyData) return null;
    const eligibleTiers = DISCOUNT_TIERS.filter(tier => tier.points <= loyaltyData.points);
    return eligibleTiers[eligibleTiers.length - 1] || null;
  };

  const getProgress = () => {
    if (!loyaltyData) return 0;
    const nextTier = getNextTier();
    const currentTierPoints = getCurrentTier()?.points || 0;
    const progress = ((loyaltyData.points - currentTierPoints) / (nextTier.points - currentTierPoints)) * 100;
    return Math.min(progress, 100);
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-6 text-center">
        <Gift className="h-10 w-10 mx-auto text-primary mb-3" />
        <h3 className="font-display text-lg font-semibold mb-2">Join Our Loyalty Program</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Sign up to earn points on every order and unlock exclusive discounts!
        </p>
        <Badge variant="secondary">Earn 1 point per KSh 10 spent</Badge>
      </div>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Loyalty Points</h3>
            <p className="text-sm text-muted-foreground">Earn rewards with every order</p>
          </div>
        </div>
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Points History</DialogTitle>
              <DialogDescription>Your recent loyalty point transactions</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No transactions yet</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {tx.type === 'earn' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <Gift className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <p className="text-sm font-medium capitalize">{tx.source}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.type === 'earn' ? 'text-green-500' : 'text-primary'}`}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Points Display */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-3">
          <Star className="h-5 w-5 text-primary fill-primary" />
          <span className="font-display text-3xl font-bold text-primary">
            {loyaltyData?.points || 0}
          </span>
          <span className="text-muted-foreground">points</span>
        </div>
        {currentTier && (
          <Badge variant="secondary" className="ml-2">
            Unlocked: {currentTier.label}
          </Badge>
        )}
      </div>

      {/* Progress to Next Tier */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress to {nextTier.label}</span>
          <span className="font-medium">
            {loyaltyData?.points || 0} / {nextTier.points} pts
          </span>
        </div>
        <Progress value={getProgress()} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {nextTier.points - (loyaltyData?.points || 0)} more points to unlock {nextTier.label}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold text-green-500">{loyaltyData?.total_earned || 0}</p>
          <p className="text-xs text-muted-foreground">Total Earned</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold text-primary">{loyaltyData?.total_redeemed || 0}</p>
          <p className="text-xs text-muted-foreground">Total Redeemed</p>
        </div>
      </div>

      {/* How to Earn */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-sm font-medium mb-2">How to earn points:</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• 1 point per KSh 10 spent on orders</p>
          <p>• 10 bonus points for writing a review</p>
          <p>• 50 bonus points for referring a friend</p>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPoints;
