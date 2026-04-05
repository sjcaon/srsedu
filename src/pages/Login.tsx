import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Loader2, ShieldCheck, BookOpen, UserCheck } from 'lucide-react';

export default function Login() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithIdentifier } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithIdentifier(adminId, password, 'admin');
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithIdentifier(studentId, studentPassword, 'student');
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Student Login Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithIdentifier(teacherId, teacherPassword, 'teacher');
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

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Sign In</CardTitle>
                <CardDescription>Use your admin ID and password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminId">ID</Label>
                    <Input id="adminId" value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="Enter admin ID" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teacher">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Sign In</CardTitle>
                <CardDescription>Use your Teacher ID and password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherId">ID</Label>
                    <Input id="teacherId" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="e.g. T-001" required />
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
                <CardDescription>Use your Student ID and password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">ID</Label>
                    <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. 2026001" required />
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
          New student and teacher accounts start with <code className="bg-muted px-1 rounded">123456</code> and must change it on first login.
        </p>
      </div>
    </div>
  );
}
