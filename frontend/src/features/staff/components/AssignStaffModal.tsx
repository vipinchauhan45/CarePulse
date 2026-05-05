import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '@/services/api';
import { User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope, UserCheck, Mail, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  type: 'doctor' | 'nurse';
}

const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  isOpen,
  onClose,
  patientId,
  type,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isDoctor = type === 'doctor';
  const Icon = isDoctor ? Stethoscope : UserCheck;

  // Fetch available staff
  const { data, isLoading, isError } = useQuery({
    queryKey: [isDoctor ? 'available-doctors' : 'available-nurses', patientId],
    queryFn: async () => {
      if (isDoctor) {
        return patientApi.getAvailableDoctors(patientId);
      }
      return patientApi.getAvailableNurses(patientId);
    },
    enabled: isOpen,
  });

  const staffList: User[] = isDoctor
    ? (data as { doctors: User[] })?.doctors || []
    : (data as { nurses: User[] })?.nurses || [];

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: () =>
      isDoctor
        ? patientApi.assignDoctors(patientId, selectedIds)
        : patientApi.assignNurses(patientId, selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      queryClient.invalidateQueries({
        queryKey: [isDoctor ? 'available-doctors' : 'available-nurses', patientId],
      });
      toast({
        title: 'Success',
        description: `${isDoctor ? 'Doctors' : 'Nurses'} assigned successfully`,
      });
      setSelectedIds([]);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to assign staff',
      });
    },
  });

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAssign = () => {
    if (selectedIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Please select at least one ${type}`,
      });
      return;
    }
    assignMutation.mutate();
  };

  const handleClose = () => {
    setSelectedIds([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            Assign {isDoctor ? 'Doctors' : 'Nurses'}
          </DialogTitle>
          <DialogDescription>
            Select the {isDoctor ? 'doctors' : 'nurses'} you want to assign to this patient.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load available {type}s</p>
              <p className="text-sm">The endpoint may not be configured yet</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No available {type}s to assign</p>
              <p className="text-sm">All {type}s are already assigned to this patient</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {staffList.map((staff) => {
                const isSelected = selectedIds.includes(staff._id);
                return (
                  <Card
                    key={staff._id}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/50',
                      isSelected && 'border-primary bg-primary/5'
                    )}
                    onClick={() => toggleSelection(staff._id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center',
                            isDoctor ? 'bg-success/10' : 'bg-vital-oxygen/10'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5',
                              isDoctor ? 'text-success' : 'text-vital-oxygen'
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {staff.email}
                          </div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedIds.length === 0 || assignMutation.isPending}
          >
            {assignMutation.isPending
              ? 'Assigning...'
              : `Assign ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignStaffModal;
