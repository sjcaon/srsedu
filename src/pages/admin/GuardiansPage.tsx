import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const emptyForm = { name: '', relation: '', occupation: '', mobile: '', email: '', income: '' };

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchGuardians = async () => {
    setLoading(true);
    const { data } = await supabase.from('guardians').select('*').order('created_at', { ascending: false });
    setGuardians(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchGuardians(); }, []);

  const handleChange = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      relation: form.relation || null,
      occupation: form.occupation || null,
      mobile: form.mobile || null,
      email: form.email || null,
      income: form.income ? Number(form.income) : null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('guardians').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('guardians').insert([payload]));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? 'Guardian updated!' : 'Guardian added!' });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
      fetchGuardians();
    }
    setSaving(false);
  };

  const handleEdit = (g: any) => {
    setForm({
      name: g.name, relation: g.relation ?? '', occupation: g.occupation ?? '',
      mobile: g.mobile ?? '', email: g.email ?? '', income: g.income?.toString() ?? '',
    });
    setEditId(g.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('guardians').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Guardian deleted' }); fetchGuardians(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Guardians</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Guardian</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? 'Edit Guardian' : 'Add Guardian'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} required /></div>
              <div className="space-y-2"><Label>Relation</Label><Input value={form.relation} onChange={(e) => handleChange('relation', e.target.value)} /></div>
              <div className="space-y-2"><Label>Occupation</Label><Input value={form.occupation} onChange={(e) => handleChange('occupation', e.target.value)} /></div>
              <div className="space-y-2"><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} /></div>
              <div className="space-y-2"><Label>Income</Label><Input type="number" value={form.income} onChange={(e) => handleChange('income', e.target.value)} /></div>
              <div className="col-span-full">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editId ? 'Update' : 'Add'} Guardian
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : guardians.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No guardians added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Relation</TableHead>
                    <TableHead>Occupation</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guardians.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>{g.relation}</TableCell>
                      <TableCell>{g.occupation}</TableCell>
                      <TableCell>{g.mobile}</TableCell>
                      <TableCell>{g.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(g)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
