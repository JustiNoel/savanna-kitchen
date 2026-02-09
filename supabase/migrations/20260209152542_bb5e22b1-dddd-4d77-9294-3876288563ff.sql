-- Enable realtime for order_items and financial_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;