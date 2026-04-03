import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Loader2, Mail, MailOpen } from 'lucide-react';

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [directory, setDirectory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ receiver_id: '', subject: '', content: '' });
  const { user, role } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [m, d] = await Promise.all([
      supabase.from('messages').select('*').order('created_at', { ascending: false }),
      supabase.rpc('get_message_directory'),
    ]);

    if (m.error || d.error) {
      toast({
        title: 'Error',
        description: m.error?.message ?? d.error?.message ?? 'Failed to load messages.',
        variant: 'destructive',
      });
      setMessages([]);
      setDirectory([]);
      setLoading(false);
      return;
    }

    setMessages(m.data ?? []);
    setDirectory((d.data ?? []).filter((entry: any) => entry.role));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getProfileName = (userId: string) => {
    if (userId === user?.id) return 'You';
    const entry = directory.find((item) => item.user_id === userId);
    return entry?.full_name || userId;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const recipient = directory.find((item) => item.user_id === form.receiver_id);
    if (!recipient) {
      toast({ title: 'Error', description: 'Please choose a valid recipient.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('messages').insert([{
      sender_id: user.id,
      sender_role: role || 'admin',
      receiver_id: form.receiver_id,
      receiver_role: recipient.role,
      subject: form.subject,
      content: form.content,
    }]);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Message sent!' });
      setDialogOpen(false);
      setForm({ receiver_id: '', subject: '', content: '' });
      fetchData();
    }
    setSaving(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('messages').update({ read_status: true }).eq('id', id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read_status: true } : m));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Messages</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Message</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label>To *</Label>
                <Select value={form.receiver_id} onValueChange={(v) => setForm((f) => ({ ...f, receiver_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                  <SelectContent>
                    {directory.map((entry) => (
                      <SelectItem key={entry.user_id} value={entry.user_id}>
                        {entry.full_name} ({entry.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Message *</Label><Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} required /></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : messages.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No messages yet</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={!m.read_status && m.receiver_id === user?.id ? 'border-primary/30 bg-accent/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {m.read_status ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}
                      <span className="font-display font-semibold">{m.subject}</span>
                      {!m.read_status && m.receiver_id === user?.id && <Badge variant="secondary" className="text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{m.content}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>From: {getProfileName(m.sender_id)}</span>
                      <span>To: {getProfileName(m.receiver_id)}</span>
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {!m.read_status && m.receiver_id === user?.id && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(m.id)}>Mark Read</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
