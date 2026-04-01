import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function StudentNotices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('notices').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setNotices(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Notices</h1>
      {notices.length === 0 ? <p className="text-muted-foreground text-center py-8">No notices</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-lg">{n.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleDateString()}</p>
                {n.image_url && <img src={n.image_url} alt={n.title} className="mt-3 rounded-lg max-h-40 object-cover w-full" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
