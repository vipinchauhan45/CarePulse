import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { patientApi } from '@/services/api';
import { AddPatientRequest, Patient } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Users, 
  User, 
  Stethoscope, 
  Plus, 
  Search,
  AlertCircle,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const StaffDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Add patient form state
  const [newPatient, setNewPatient] = useState<AddPatientRequest>({
    name: '',
    age: 0,
    gender: 'male',
    machineKey: '',
    medicalHistory: [],
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients'],
    queryFn: patientApi.getAllPatients,
  });

  const addPatientMutation = useMutation({
    mutationFn: patientApi.addPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsAddDialogOpen(false);
      setNewPatient({
        name: '',
        age: 0,
        gender: 'male',
        machineKey: '',
        medicalHistory: [],
      });
    },
  });

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    addPatientMutation.mutate(newPatient);
  };

  const filteredPatients = data?.patient?.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handlePatientClick = (patientId: string) => {
    localStorage.setItem('last_patient_id', patientId);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Patient Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage patient vital signs
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Register a new patient for monitoring
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPatient}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-name">Patient Name</Label>
                    <Input
                      id="patient-name"
                      placeholder="John Doe"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient-age">Age</Label>
                      <Input
                        id="patient-age"
                        type="number"
                        min="0"
                        max="150"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patient-gender">Gender</Label>
                      <Select 
                        value={newPatient.gender} 
                        onValueChange={(value: 'male' | 'female' | 'other') => 
                          setNewPatient({ ...newPatient, gender: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="machine-key">Machine Key</Label>
                    <Input
                      id="machine-key"
                      placeholder="MONITOR-001"
                      value={newPatient.machineKey}
                      onChange={(e) => setNewPatient({ ...newPatient, machineKey: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique identifier for the monitoring device
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addPatientMutation.isPending}>
                    {addPatientMutation.isPending ? 'Adding...' : 'Add Patient'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{data?.patient?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Activity className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Monitors</p>
                <p className="text-2xl font-bold">{data?.patient?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-vital-oxygen/10 rounded-lg">
                <Stethoscope className="h-5 w-5 text-vital-oxygen" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doctors</p>
                <p className="text-2xl font-bold">
                  {new Set(data?.patient?.flatMap(p => p.assignedDoctors?.map(d => d._id)) || []).size}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-vital-temp/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-vital-temp" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nurses</p>
                <p className="text-2xl font-bold">
                  {new Set(data?.patient?.flatMap(p => p.assignedNurses?.map(n => n._id)) || []).size}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-border">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Failed to Load Patients</h3>
              <p className="text-muted-foreground mt-1">Please check your connection and try again.</p>
            </CardContent>
          </Card>
        ) : filteredPatients.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                {searchQuery ? 'No patients found' : 'No patients yet'}
              </h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Add your first patient to start monitoring vital signs'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <PatientCard 
                key={patient._id} 
                patient={patient} 
                onClick={() => handlePatientClick(patient._id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Patient Card Component
interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  return (
    <Link to={`/staff/patient/${patient._id}`} onClick={onClick}>
      <Card className="border-border card-interactive h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {patient.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <CardTitle className="text-lg">{patient.name}</CardTitle>
                <CardDescription>
                  {patient.age} years • {patient.gender}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <Activity className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Machine Key */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Machine:</span>
            <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
              {patient.machineKey}
            </code>
          </div>

          {/* Assigned Staff */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">
                {patient.assignedDoctors?.length || 0} Doctors
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-vital-oxygen" />
              <span className="text-muted-foreground">
                {patient.assignedNurses?.length || 0} Nurses
              </span>
            </div>
          </div>

          {/* Action */}
          <Button variant="outline" className="w-full gap-2 mt-2">
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export default StaffDashboard;
