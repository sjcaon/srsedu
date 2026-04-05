import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, LockKeyhole } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading, accessContext, refreshAccessContext } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const isManagedUser = role === 'student' || role === 'teacher';
  const isForcedReset = isManagedUser && accessContext.isFirstLogin;

  const helperText = useMemo(() => {
    if (isForcedReset) {
      return 'You must change the default password before entering your dashboard.';
    }

    return 'Update your password anytime to keep your account secure.';
  }, [isForcedReset]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please enter the same password twice.', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;

      if (isForcedReset) {
        const { error: flagError } = await supabase.rpc('complete_first_login');
        if (flagError) throw flagError;
      }

      await refreshAccessContext();

      toast({ title: 'Password updated', description: isForcedReset ? 'You can now access your dashboard.' : 'Your new password has been saved.' });
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast({ title: 'Unable to update password', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle>{isForcedReset ? 'Change your default password' : 'Change password'}</CardTitle>
          <CardDescription>{helperText}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}