
-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  q1_delivery_speed INTEGER NOT NULL CHECK (q1_delivery_speed BETWEEN 1 AND 10),
  q2_food_taste INTEGER NOT NULL CHECK (q2_food_taste BETWEEN 1 AND 10),
  q3_food_presentation INTEGER NOT NULL CHECK (q3_food_presentation BETWEEN 1 AND 10),
  q4_packaging_quality INTEGER NOT NULL CHECK (q4_packaging_quality BETWEEN 1 AND 10),
  q5_ordering_ease INTEGER NOT NULL CHECK (q5_ordering_ease BETWEEN 1 AND 10),
  q6_customer_service INTEGER NOT NULL CHECK (q6_customer_service BETWEEN 1 AND 10),
  q7_overall_rating INTEGER NOT NULL CHECK (q7_overall_rating BETWEEN 1 AND 10),
  q8_improvements TEXT,
  q9_remove_or_add TEXT,
  q10_additional_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own survey (one per email enforced by unique constraint)
CREATE POLICY "Users can insert own survey" ON public.survey_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own survey
CREATE POLICY "Users can view own survey" ON public.survey_responses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all surveys
CREATE POLICY "Admins can view all surveys" ON public.survey_responses
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
