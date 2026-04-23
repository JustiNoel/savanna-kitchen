
CREATE TABLE public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_key text NOT NULL UNIQUE,
  label text NOT NULL,
  question_type text NOT NULL DEFAULT 'rating',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  min_value integer DEFAULT 1,
  max_value integer DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions" ON public.survey_questions
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage questions" ON public.survey_questions
  FOR ALL TO public USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.survey_questions (question_key, label, question_type, sort_order) VALUES
  ('q1_delivery_speed', 'How quick was your delivery? (1 = Very Late, 10 = Super Fast)', 'rating', 1),
  ('q2_food_taste', 'How would you rate the food taste? (1 = Poor, 10 = Amazing)', 'rating', 2),
  ('q3_food_presentation', 'How was the food presentation & freshness? (1 = Bad, 10 = Excellent)', 'rating', 3),
  ('q4_packaging_quality', 'How was the packaging quality? (1 = Poor, 10 = Perfect)', 'rating', 4),
  ('q5_ordering_ease', 'How easy was it to place your order? (1 = Difficult, 10 = Very Easy)', 'rating', 5),
  ('q6_customer_service', 'How would you rate our customer service? (1 = Poor, 10 = Outstanding)', 'rating', 6),
  ('q7_overall_rating', 'Overall, how would you rate Grabbys out of 10?', 'rating', 7),
  ('q8_improvements', 'What would you like us to improve?', 'text', 8),
  ('q9_remove_or_add', 'Is there anything you think should be added or removed from our menu/service?', 'text', 9),
  ('q10_additional_feedback', 'Any other thoughts or suggestions for us?', 'text', 10);

CREATE TABLE public.survey_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_response_id uuid NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  rating_value integer,
  text_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own answers" ON public.survey_answers
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.survey_responses sr
    WHERE sr.id = survey_response_id AND sr.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own answers" ON public.survey_answers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.survey_responses sr
    WHERE sr.id = survey_response_id AND sr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all answers" ON public.survey_answers
  FOR SELECT TO public
  USING (public.has_role(auth.uid(), 'admin'));
