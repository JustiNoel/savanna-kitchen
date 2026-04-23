import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ClipboardList, Plus, Trash2, Edit2, Save, X, Clock, CalendarDays } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SurveyQuestion {
  id: string;
  question_key: string;
  label: string;
  question_type: string;
  sort_order: number;
  is_active: boolean;
  min_value: number;
  max_value: number;
  created_at: string;
}

const SURVEY_DURATION_DAYS = 30;

const SurveysSection = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editType, setEditType] = useState('rating');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'rating' | 'text'>('rating');
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch questions
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['survey-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_questions' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as SurveyQuestion[];
    },
  });

  // Fetch responses
  const { data: surveys, isLoading: loadingSurveys } = useQuery({
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

  // Fetch dynamic answers
  const { data: answers } = useQuery({
    queryKey: ['admin-survey-answers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_answers' as any)
        .select('*');
      if (error) throw error;
      return data as any[];
    },
  });

  // Add question
  const addMutation = useMutation({
    mutationFn: async ({ label, type }: { label: string; type: string }) => {
      const nextOrder = (questions?.length || 0) + 1;
      const key = `q${nextOrder}_custom_${Date.now()}`;
      const { error } = await supabase.from('survey_questions' as any).insert({
        question_key: key,
        label,
        question_type: type,
        sort_order: nextOrder,
        is_active: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] });
      toast.success('Question added!');
      setNewLabel('');
      setShowAddForm(false);
    },
    onError: () => toast.error('Failed to add question'),
  });

  // Update question
  const updateMutation = useMutation({
    mutationFn: async ({ id, label, type }: { id: string; label: string; type: string }) => {
      const { error } = await supabase
        .from('survey_questions' as any)
        .update({ label, question_type: type, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] });
      toast.success('Question updated!');
      setEditingId(null);
    },
    onError: () => toast.error('Failed to update question'),
  });

  // Toggle active
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('survey_questions' as any)
        .update({ is_active, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] });
      toast.success('Question toggled!');
    },
  });

  // Delete question
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('survey_questions' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] });
      toast.success('Question deleted!');
    },
    onError: () => toast.error('Failed to delete question'),
  });

  // Survey campaign info
  const campaignStart = surveys?.length ? surveys[surveys.length - 1]?.created_at : null;
  const firstResponseDate = campaignStart ? new Date(campaignStart) : new Date();
  const surveyEndDate = addDays(firstResponseDate, SURVEY_DURATION_DAYS);
  const daysRemaining = Math.max(0, differenceInDays(surveyEndDate, new Date()));

  // Averages from legacy columns
  const LEGACY_KEYS: Record<string, string> = {
    q1_delivery_speed: 'Delivery Speed',
    q2_food_taste: 'Food Taste',
    q3_food_presentation: 'Food Presentation',
    q4_packaging_quality: 'Packaging Quality',
    q5_ordering_ease: 'Ordering Ease',
    q6_customer_service: 'Customer Service',
    q7_overall_rating: 'Overall Rating',
  };

  const averages = useMemo(() => {
    if (!surveys?.length) return null;
    const ratingKeys = Object.keys(LEGACY_KEYS);
    const avgs: Record<string, number> = {};
    ratingKeys.forEach((key) => {
      const values = surveys.map((s: any) => s[key]).filter((v: any) => typeof v === 'number');
      avgs[key] = values.length ? Number((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1)) : 0;
    });
    return avgs;
  }, [surveys]);

  if (loadingQuestions || loadingSurveys) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Surveys</h2>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <CalendarDays className="h-3.5 w-3.5" />
            {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Survey period ended'}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            {surveys?.length || 0} responses
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions">📋 Questions ({questions?.length || 0})</TabsTrigger>
          <TabsTrigger value="responses">📊 Responses ({surveys?.length || 0})</TabsTrigger>
        </TabsList>

        {/* QUESTIONS TAB */}
        <TabsContent value="questions" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Survey Questions</CardTitle>
                <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Add form */}
              {showAddForm && (
                <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium text-primary">New Question</p>
                    <Input
                      placeholder="Enter question text..."
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                    <div className="flex items-center gap-3">
                      <Select value={newType} onValueChange={(v) => setNewType(v as 'rating' | 'text')}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Rating (1-10)</SelectItem>
                          <SelectItem value="text">Text Answer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => newLabel.trim() && addMutation.mutate({ label: newLabel.trim(), type: newType })}
                        disabled={!newLabel.trim() || addMutation.isPending}
                      >
                        {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Question list */}
              {questions?.map((q, index) => (
                <Card key={q.id} className={`transition-all ${!q.is_active ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    {editingId === q.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="font-medium"
                        />
                        <div className="flex items-center gap-3">
                          <Select value={editType} onValueChange={setEditType}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rating">Rating (1-10)</SelectItem>
                              <SelectItem value="text">Text Answer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: q.id, label: editLabel, type: editType })}
                            disabled={updateMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Q{index + 1}</Badge>
                            <Badge variant={q.question_type === 'rating' ? 'default' : 'secondary'} className="text-xs">
                              {q.question_type === 'rating' ? '⭐ Rating' : '📝 Text'}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{q.label}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={q.is_active}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: q.id, is_active: checked })}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingId(q.id);
                              setEditLabel(q.label);
                              setEditType(q.question_type);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Delete this question? This cannot be undone.')) {
                                deleteMutation.mutate(q.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {!questions?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No questions yet. Add your first question above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESPONSES TAB */}
        <TabsContent value="responses" className="space-y-4 mt-4">
          {/* Averages summary */}
          {averages && surveys && surveys.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(LEGACY_KEYS).map(([key, label]) => (
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
              {surveys.map((survey: any) => {
                const surveyDate = new Date(survey.created_at);
                const expiresAt = addDays(surveyDate, SURVEY_DURATION_DAYS);
                const daysLeft = Math.max(0, differenceInDays(expiresAt, new Date()));

                return (
                  <Card key={survey.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm font-medium">{survey.email}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                          </Badge>
                          <Badge variant="outline">
                            {format(surveyDate, 'MMM d, yyyy h:mm a')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {Object.entries(LEGACY_KEYS).map(([key, label]) => {
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
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SurveysSection;
