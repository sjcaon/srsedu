import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Loader2, ShieldCheck, BookOpen, UserCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* Admin / general email login */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        toast({ title: 'Account created!', description: 'Check your email to verify your account.' });
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /* Student login: lookup email by roll_number, then sign in */
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('email')
        .eq('roll_number', studentId.trim())
        .maybeSingle();

      if (error) throw error;
      if (!student?.email) throw new Error('No student found with that ID. Contact admin.');

      await signIn(student.email, studentPassword);
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Student Login Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /* Teacher login: lookup by email or teacher id (we use the email field directly or nid as teacher ID) */
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const identifier = teacherId.trim();
      let teacherEmail = identifier;

      // If it doesn't look like an email, try looking up the teacher by nid (Teacher ID)
      if (!identifier.includes('@')) {
        const { data: teacher, error } = await supabase
          .from('teachers')
          .select('email')
          .eq('nid', identifier)
          .maybeSingle();

        if (error) throw error;
        if (!teacher?.email) throw new Error('No teacher found with that ID. Contact admin.');
        teacherEmail = teacher.email;
      }

      await signIn(teacherEmail, teacherPassword);
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Teacher Login Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">SRS Academic Coaching</h1>
          <p className="text-muted-foreground mt-1">Management System</p>
        </div>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="admin" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Admin</TabsTrigger>
            <TabsTrigger value="teacher" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Teacher</TabsTrigger>
            <TabsTrigger value="student" className="gap-1.5"><UserCheck className="h-3.5 w-3.5" /> Student</TabsTrigger>
          </TabsList>

          {/* Admin / Email login */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>{isSignUp ? 'Create Account' : 'Admin Sign In'}</CardTitle>
                <CardDescription>{isSignUp ? 'Register a new account' : 'Use your email & password'}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <button type="button" className="text-sm text-primary hover:underline" onClick={() => setIsSignUp(!isSignUp)}>
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher login */}
          <TabsContent value="teacher">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Sign In</CardTitle>
                <CardDescription>Use your Teacher ID (NID) or Email</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherId">Teacher ID or Email</Label>
                    <Input id="teacherId" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="NID or email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherPwd">Password</Label>
                    <Input id="teacherPwd" type="password" value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} placeholder="Default: 123456" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In as Teacher
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student login */}
          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Sign In</CardTitle>
                <CardDescription>Use your Student ID (Roll Number)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. CLASS-9-001" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentPwd">Password</Label>
                    <Input id="studentPwd" type="password" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} placeholder="Default: 123456" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In as Student
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Default password for new accounts: <code className="bg-muted px-1 rounded">123456</code> — Contact admin for credentials
        </p>
      </div>
    </div>
  );
}
