import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi } from '@/services/api';
import { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Lock, User, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';

const AddStaffPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('doctor');
  const [success, setSuccess] = useState('');

  const addStaffMutation = useMutation({
    mutationFn: adminApi.addStaff,
    onSuccess: () => {
      setSuccess('Staff member created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setRole('doctor');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addStaffMutation.mutate({ name, email, password, role });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Add Staff Member</CardTitle>
            <CardDescription>
              Create a new account for a doctor, nurse, or administrator
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {addStaffMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {(addStaffMutation.error as any)?.response?.data?.msg || 
                     'Failed to create staff member. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-success bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Dr. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane.doe@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/admin')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={addStaffMutation.isPending}
                >
                  {addStaffMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Staff Member'
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddStaffPage;
