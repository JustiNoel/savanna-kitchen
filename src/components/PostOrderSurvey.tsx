import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PostOrderSurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

const QUESTIONS = [
  { key: 'q1_delivery_speed', label: '1. How quick was your delivery? (1 = Very Late, 10 = Super Fast)', type: 'rating' },
  { key: 'q2_food_taste', label: '2. How would you rate the food taste? (1 = Poor, 10 = Amazing)', type: 'rating' },
  { key: 'q3_food_presentation', label: '3. How was the food presentation & freshness? (1 = Bad, 10 = Excellent)', type: 'rating' },
  { key: 'q4_packaging_quality', label: '4. How was the packaging quality? (1 = Poor, 10 = Perfect)', type: 'rating' },
  { key: 'q5_ordering_ease', label: '5. How easy was it to place your order? (1 = Difficult, 10 = Very Easy)', type: 'rating' },
  { key: 'q6_customer_service', label: '6. How would you rate our customer service? (1 = Poor, 10 = Outstanding)', type: 'rating' },
  { key: 'q7_overall_rating', label: '7. Overall, how would you rate Grabbys out of 10?', type: 'rating' },
  { key: 'q8_improvements', label: '8. What would you like us to improve?', type: 'text' },
  { key: 'q9_remove_or_add', label: '9. Is there anything you think should be added or removed from our menu/service?', type: 'text' },
  { key: 'q10_additional_feedback', label: '10. Any other thoughts or suggestions for us?', type: 'text' },
] as const;

const PostOrderSurvey = ({ open, onOpenChange, orderId }: PostOrderSurveyProps) => {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number | string>>({
    q1_delivery_speed: 5,
    q2_food_taste: 5,
    q3_food_presentation: 5,
    q4_packaging_quality: 5,
    q5_ordering_ease: 5,
    q6_customer_service: 5,
    q7_overall_rating: 5,
    q8_improvements: '',
    q9_remove_or_add: '',
    q10_additional_feedback: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setRating = (key: string, value: number) => setAnswers(prev => ({ ...prev, [key]: value }));
  const setText = (key: string, value: string) => setAnswers(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!user?.email) {
      toast.error('You must be signed in to submit the survey.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('survey_responses' as any).insert({
      user_id: user.id,
      email: user.email,
      order_id: orderId,
      q1_delivery_speed: answers.q1_delivery_speed,
      q2_food_taste: answers.q2_food_taste,
      q3_food_presentation: answers.q3_food_presentation,
      q4_packaging_quality: answers.q4_packaging_quality,
      q5_ordering_ease: answers.q5_ordering_ease,
      q6_customer_service: answers.q6_customer_service,
      q7_overall_rating: answers.q7_overall_rating,
      q8_improvements: (answers.q8_improvements as string) || null,
      q9_remove_or_add: (answers.q9_remove_or_add as string) || null,
      q10_additional_feedback: (answers.q10_additional_feedback as string) || null,
    } as any);

    setSubmitting(false);

    if (error) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.info("You've already completed this survey. Thank you! 🙏");
        setSubmitted(true);
      } else {
        toast.error('Failed to submit survey. Please try again.');
        console.error('Survey error:', error);
      }
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-green-500/20 rounded-full" />
              <div className="relative bg-green-500 rounded-full p-4">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold text-green-600">Thank You So Much! 🎉</h3>
            <p className="text-muted-foreground max-w-xs">
              We truly appreciate your feedback! Your responses help us serve you better. 
              Enjoy your meal and have a wonderful day! 💚
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display text-xl">Quick Survey 📋</DialogTitle>
          <DialogDescription>
            Your order is on its way! While you wait, help us improve by answering these 10 quick questions. This survey is available for 30 days.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-6 pb-4">
            {QUESTIONS.map((q) => (
              <div key={q.key} className="space-y-2">
                <label className="text-sm font-medium leading-snug block">{q.label}</label>
                {q.type === 'rating' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[answers[q.key] as number]}
                        onValueChange={(v) => setRating(q.key, v[0])}
                        min={1}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-primary w-8 text-center">
                        {answers[q.key]}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answers[q.key] as string}
                    onChange={(e) => setText(q.key, e.target.value)}
                    rows={2}
                    maxLength={500}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="px-6 pb-6 pt-2 border-t border-border">
          <Button className="w-full" onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
            ) : (
              'Submit Survey 🚀'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostOrderSurvey;
