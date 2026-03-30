import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Users, BookOpen, Send, Loader2 } from 'lucide-react';

export default function PublicHome() {
  const [stats, setStats] = useState({ students: 0, teachers: 0 });
  const [notices, setNotices] = useState<any[]>([]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const [s, t, n] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3),
      ]);
      setStats({ students: s.count ?? 0, teachers: t.count ?? 0 });
      setNotices(n.data ?? []);
    };
    fetchData();
  }, []);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from('contacts').insert([contactForm]);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Message sent!', description: 'We will get back to you soon.' });
      setContactForm({ name: '', email: '', message: '' });
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">SRS Academic Coaching</span>
          </div>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
            Empowering Students for a{' '}
            <span className="text-primary">Brighter Future</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Quality academic coaching with experienced teachers, comprehensive curriculum, and personalized attention for every student.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link to="/login"><Button size="lg">Get Started</Button></Link>
            <a href="#contact"><Button size="lg" variant="outline">Contact Us</Button></a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-display font-bold">{stats.students}+</p>
            <p className="text-muted-foreground">Students Enrolled</p>
          </div>
          <div>
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-display font-bold">{stats.teachers}+</p>
            <p className="text-muted-foreground">Expert Teachers</p>
          </div>
          <div>
            <GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-display font-bold">7</p>
            <p className="text-muted-foreground">Classes (6-12)</p>
          </div>
        </div>
      </section>

      {/* Notices */}
      {notices.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-center mb-8">Latest Notices</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notices.map((n) => (
                <Card key={n.id}>
                  {n.image_url && (
                    <img src={n.image_url} alt={n.title} className="w-full h-40 object-cover rounded-t-lg" />
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-display font-semibold">{n.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="py-16 px-4 bg-card">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-display font-bold text-center mb-8">Contact Us</h2>
          <form onSubmit={handleContact} className="space-y-4">
            <Input
              placeholder="Your name"
              value={contactForm.name}
              onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder="Your email"
              value={contactForm.email}
              onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Textarea
              placeholder="Your message"
              value={contactForm.message}
              onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
              rows={4}
              required
            />
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Message
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} SRS Academic Coaching. All rights reserved.
      </footer>
    </div>
  );
}
