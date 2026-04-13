import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Monitor, AlertTriangle, Users, Globe, LogOut, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const SecuritySection = () => {
  const [terminatingSession, setTerminatingSession] = useState(false);
  const { data: logs, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as AuditLog[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('audit-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const allLogs = logs || [];
  const loginLogs = allLogs.filter(l => l.event_type === 'login');
  const uniqueUsers = [...new Set(loginLogs.map(l => l.user_email))];
  const uniqueIPs = [...new Set(loginLogs.map(l => l.ip_address).filter(Boolean))];
  
  // Flag suspicious: same user from multiple IPs
  const userIpMap: Record<string, Set<string>> = {};
  loginLogs.forEach(l => {
    if (l.user_email && l.ip_address) {
      if (!userIpMap[l.user_email]) userIpMap[l.user_email] = new Set();
      userIpMap[l.user_email].add(l.ip_address);
    }
  });
  const suspiciousUsers = Object.entries(userIpMap).filter(([, ips]) => ips.size > 2);

  // Admin login attempts
  const adminLogs = allLogs.filter(l => 
    l.event_type === 'admin_access' || 
    (l.metadata && l.metadata.is_admin)
  );

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'login': return <Badge className="bg-green-500/20 text-green-700 border-green-300">Login</Badge>;
      case 'logout': return <Badge className="bg-gray-500/20 text-gray-700 border-gray-300">Logout</Badge>;
      case 'admin_access': return <Badge className="bg-purple-500/20 text-purple-700 border-purple-300">Admin Access</Badge>;
      case 'signup': return <Badge className="bg-blue-500/20 text-blue-700 border-blue-300">Sign Up</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const parseUA = (ua: string | null) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Mobile')) return '📱 Mobile';
    if (ua.includes('Tablet')) return '📱 Tablet';
    return '💻 Desktop';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold">Security & Audit Dashboard</h2>
        </div>
        <Button
          variant="destructive"
          disabled={terminatingSession}
          onClick={async () => {
            setTerminatingSession(true);
            try {
              const { data, error } = await supabase.functions.invoke('admin-terminate-sessions');
              if (error) throw error;
              toast.success(data?.message || 'All other sessions terminated successfully');
            } catch (err: any) {
              toast.error(err.message || 'Failed to terminate sessions');
            } finally {
              setTerminatingSession(false);
            }
          }}
        >
          {terminatingSession ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
          Terminate Other Sessions
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{uniqueUsers.length}</p>
                <p className="text-xs text-muted-foreground">Unique Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{uniqueIPs.length}</p>
                <p className="text-xs text-muted-foreground">Unique IPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{allLogs.length}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={suspiciousUsers.length > 0 ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-8 w-8 ${suspiciousUsers.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-2xl font-bold">{suspiciousUsers.length}</p>
                <p className="text-xs text-muted-foreground">Multi-IP Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Activity */}
      {suspiciousUsers.length > 0 && (
        <Card className="border-red-400">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Suspicious Activity — Users with 3+ IP Addresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suspiciousUsers.map(([email, ips]) => (
                <div key={email} className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200">
                  <p className="font-semibold">{email}</p>
                  <p className="text-sm text-muted-foreground">Logged in from {ips.size} different IPs:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[...ips].map(ip => (
                      <Badge key={ip} variant="outline" className="font-mono text-xs">{ip}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Access Logs */}
      {adminLogs.length > 0 && (
        <Card className="border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Shield className="h-5 w-5" />
              Admin Portal Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user_email || 'Unknown'}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ip_address || 'N/A'}</TableCell>
                      <TableCell>{parseUA(log.user_agent)}</TableCell>
                      <TableCell className="text-xs">{format(new Date(log.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Full Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>All Activity Logs (Last 200)</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{getEventBadge(log.event_type)}</TableCell>
                    <TableCell className="font-medium text-sm">{log.user_email || 'Unknown'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip_address || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{parseUA(log.user_agent)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(log.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                  </TableRow>
                ))}
                {allLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No activity logged yet. Logins will appear here in real-time.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySection;
