import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';

const QUESTION_LABELS: Record<string, string> = {
  q1_delivery_speed: 'Delivery Speed',
  q2_food_taste: 'Food Taste',
  q3_food_presentation: 'Food Presentation',
  q4_packaging_quality: 'Packaging Quality',
  q5_ordering_ease: 'Ordering Ease',
  q6_customer_service: 'Customer Service',
  q7_overall_rating: 'Overall Rating',
};

const SurveysSection = () => {
  const { data: surveys, isLoading } = useQuery({
    queryKey: ['admin-surveys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_responses' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const averages = useMemo(() => {
    if (!surveys?.length) return null;
    const ratingKeys = Object.keys(QUESTION_LABELS);
    const avgs: Record<string, number> = {};
    ratingKeys.forEach((key) => {
      const values = surveys.map((s: any) => s[key]).filter((v: any) => typeof v === 'number');
      avgs[key] = values.length ? Number((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1)) : 0;
    });
    return avgs;
  }, [surveys]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Customer Surveys ({surveys?.length || 0})</h2>

      {/* Averages summary */}
      {averages && surveys && surveys.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(QUESTION_LABELS).map(([key, label]) => (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-bold text-primary">{averages[key]}</p>
                <p className="text-[10px] text-muted-foreground">/ 10</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!surveys?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No survey responses yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey: any) => (
            <Card key={survey.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-medium">{survey.email}</CardTitle>
                  <Badge variant="outline">{format(new Date(survey.created_at), 'MMM d, yyyy h:mm a')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Rating scores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {Object.entries(QUESTION_LABELS).map(([key, label]) => {
                    const val = survey[key];
                    const color = val >= 8 ? 'text-green-600' : val >= 5 ? 'text-yellow-600' : 'text-red-600';
                    return (
                      <div key={key} className="text-center p-2 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className={`text-lg font-bold ${color}`}>{val}/10</p>
                      </div>
                    );
                  })}
                </div>

                {/* Text responses */}
                {survey.q8_improvements && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">💡 Improvements Suggested:</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">{survey.q8_improvements}</p>
                  </div>
                )}
                {survey.q9_remove_or_add && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">📝 Add/Remove Suggestions:</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">{survey.q9_remove_or_add}</p>
                  </div>
                )}
                {survey.q10_additional_feedback && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">💬 Additional Feedback:</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">{survey.q10_additional_feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SurveysSection;
