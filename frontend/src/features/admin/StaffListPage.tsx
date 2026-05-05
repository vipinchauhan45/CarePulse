import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { adminApi } from '@/services/api';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Trash2, AlertCircle, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const StaffListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['staff'],
    queryFn: adminApi.getAllStaff,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeleteTarget(null);
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'doctor':
        return 'bg-success/10 text-success border-success/20';
      case 'nurse':
        return 'bg-vital-oxygen/10 text-vital-oxygen border-vital-oxygen/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleDelete = (user: User) => {
    setDeleteTarget(user);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget._id);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Directory</h1>
            <p className="text-muted-foreground mt-1">
              Manage all registered staff members
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">
              {data?.users?.length || 0} Staff Members
            </span>
          </div>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              All Staff Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center py-12 text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Failed to load staff list. {(error as any)?.message}</span>
              </div>
            ) : data?.users?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No staff members found</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users?.map((user) => (
                      <TableRow key={user._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn('capitalize', getRoleBadgeVariant(user.role))}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default StaffListPage;
