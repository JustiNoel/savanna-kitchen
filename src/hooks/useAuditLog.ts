import { supabase } from '@/integrations/supabase/client';

export const logAuditEvent = async (
  userId: string,
  email: string | null,
  eventType: string,
  metadata: Record<string, any> = {}
) => {
  try {
    // Get IP from a free API
    let ip = null;
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ip = data.ip;
    } catch { /* silent */ }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: email,
      event_type: eventType,
      ip_address: ip,
      user_agent: navigator.userAgent,
      metadata,
    } as any);
  } catch (err) {
    console.error('Audit log error:', err);
  }
};
