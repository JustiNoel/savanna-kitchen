import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { addDays, differenceInDays } from 'date-fns';

interface PostOrderSurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

interface SurveyQuestion {
  id: string;
  question_key: string;
  label: string;
  question_type: string;
  sort_order: number;
  is_active: boolean;
  min_value: number;
  max_value: number;
}

const SURVEY_DURATION_DAYS = 30;
const ESTIMATED_SECONDS = 60; // ~1 minute

const PostOrderSurvey = ({ open, onOpenChange, orderId }: PostOrderSurveyProps) => {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Fetch questions from DB
  const { data: questions, isLoading } = useQuery({
    queryKey: ['survey-questions-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_questions' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as SurveyQuestion[];
    },
    enabled: open,
  });

  // Initialize defaults when questions load
  useEffect(() => {
    if (questions?.length) {
      const defaults: Record<string, number | string> = {};
      questions.forEach((q) => {
        if (q.question_type === 'rating') {
          defaults[q.id] = 5;
        } else {
          defaults[q.id] = '';
        }
      });
      setAnswers(defaults);
      setCurrentStep(0);
    }
  }, [questions]);

  const daysRemaining = SURVEY_DURATION_DAYS; // Fresh survey = full 30 days
  const progress = questions?.length ? ((currentStep + 1) / questions.length) * 100 : 0;

  const handleNext = () => {
    if (questions && currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.email || !questions?.length) {
      toast.error('You must be signed in to submit the survey.');
      return;
    }

    setSubmitting(true);

    // Build legacy columns from known keys for backward compat
    const legacyMap: Record<string, string> = {};
    questions.forEach((q) => {
      legacyMap[q.question_key] = q.id;
    });

    const legacyPayload: any = {
      user_id: user.id,
      email: user.email,
      order_id: orderId,
      q1_delivery_speed: 5,
      q2_food_taste: 5,
      q3_food_presentation: 5,
      q4_packaging_quality: 5,
      q5_ordering_ease: 5,
      q6_customer_service: 5,
      q7_overall_rating: 5,
    };

    // Map answers back to legacy columns where possible
    questions.forEach((q) => {
      const val = answers[q.id];
      if (q.question_key in legacyPayload && q.question_type === 'rating') {
        legacyPayload[q.question_key] = val;
      }
      if (q.question_key === 'q8_improvements') legacyPayload.q8_improvements = val || null;
      if (q.question_key === 'q9_remove_or_add') legacyPayload.q9_remove_or_add = val || null;
      if (q.question_key === 'q10_additional_feedback') legacyPayload.q10_additional_feedback = val || null;
    });

    // Insert legacy response
    const { data: responseData, error } = await supabase
      .from('survey_responses' as any)
      .insert(legacyPayload)
      .select('id')
      .single();

    if (error) {
      setSubmitting(false);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.info("You've already completed this survey. Thank you! 🙏");
        setSubmitted(true);
      } else {
        toast.error('Failed to submit survey. Please try again.');
        console.error('Survey error:', error);
      }
      return;
    }

    // Insert dynamic answers
    if (responseData) {
      const dynamicAnswers = questions.map((q) => ({
        survey_response_id: (responseData as any).id,
        question_id: q.id,
        rating_value: q.question_type === 'rating' ? (answers[q.id] as number) : null,
        text_value: q.question_type === 'text' ? (answers[q.id] as string) || null : null,
      }));

      await supabase.from('survey_answers' as any).insert(dynamicAnswers as any);
    }

    setSubmitting(false);
    setSubmitted(true);
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

  const currentQuestion = questions?.[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display text-xl">Quick Survey 📋</DialogTitle>
          <DialogDescription>
            Takes about 1 minute. Help us improve Grabbys!
          </DialogDescription>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{ESTIMATED_SECONDS}s • {daysRemaining} days left
            </Badge>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {questions?.length || 0}
            </span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : currentQuestion ? (
          <div className="px-6 py-4">
            <div className="space-y-4 min-h-[120px]">
              <label className="text-sm font-medium leading-snug block">
                Q{currentStep + 1}. {currentQuestion.label}
              </label>
              {currentQuestion.question_type === 'rating' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[answers[currentQuestion.id] as number || 5]}
                      onValueChange={(v) =>
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v[0] }))
                      }
                      min={currentQuestion.min_value || 1}
                      max={currentQuestion.max_value || 10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold text-primary w-10 text-center">
                      {answers[currentQuestion.id] || 5}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                    <span>{currentQuestion.min_value || 1}</span>
                    <span>{Math.ceil(((currentQuestion.max_value || 10) - (currentQuestion.min_value || 1)) / 2) + (currentQuestion.min_value || 1)}</span>
                    <span>{currentQuestion.max_value || 10}</span>
                  </div>
                </div>
              ) : (
                <Textarea
                  placeholder="Type your answer here..."
                  value={(answers[currentQuestion.id] as string) || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
                  }
                  rows={3}
                  maxLength={500}
                />
              )}
            </div>
          </div>
        ) : null}

        <div className="px-6 pb-6 pt-2 border-t border-border flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1"
          >
            ← Previous
          </Button>
          {questions && currentStep === questions.length - 1 ? (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
              ) : (
                'Submit Survey 🚀'
              )}
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleNext}>
              Next →
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostOrderSurvey;
