import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

const roles = ['admin', 'teacher', 'student', 'guardian'] as const;

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  student: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  guardian: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export default function RolesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
    ]);
    setProfiles(p.data ?? []);
    const roleMap: Record<string, string> = {};
    (r.data ?? []).forEach((ur) => { roleMap[ur.user_id] = ur.role; });
    setUserRoles(roleMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingId(userId);
    const currentRole = userRoles[userId];
    if (currentRole) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', userId);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Role updated!' });
        setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
      }
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole as any }]);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Role assigned!' });
        setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
      }
    }
    setSavingId(null);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-display font-bold">Role Management</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : profiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users registered yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Assign Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || 'N/A'}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>
                        {userRoles[p.user_id] ? (
                          <Badge className={roleColors[userRoles[p.user_id]] || ''}>
                            {userRoles[p.user_id]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No role</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={pendingChanges[p.user_id] || userRoles[p.user_id] || ''}
                            onValueChange={(v) => setPendingChanges((prev) => ({ ...prev, [p.user_id]: v }))}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {pendingChanges[p.user_id] && pendingChanges[p.user_id] !== userRoles[p.user_id] && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingId === p.user_id}
                              onClick={() => {
                                handleRoleChange(p.user_id, pendingChanges[p.user_id]);
                                setPendingChanges((prev) => {
                                  const next = { ...prev };
                                  delete next[p.user_id];
                                  return next;
                                });
                              }}
                            >
                              {savingId === p.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                            </Button>
                          )}
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
