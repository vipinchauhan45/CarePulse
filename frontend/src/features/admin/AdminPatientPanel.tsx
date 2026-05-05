import React, { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { patientApi } from "@/services/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Search, RefreshCw, Users } from "lucide-react";
import type { Patient } from "@/types";

const AdminPatientsPage: React.FC = () => {
  const [q, setQ] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: patientApi.getAllPatients,
    retry: 1,
  });

  const patients: Patient[] = data?.patient ?? [];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((p) => {
      const name = (p?.name ?? "").toLowerCase();
      const machineKey = (p?.machineKey ?? "").toLowerCase();
      const gender = (p?.gender ?? "").toLowerCase();
      const age = String(p?.age ?? "").toLowerCase();

      return (
        name.includes(query) ||
        machineKey.includes(query) ||
        gender.includes(query) ||
        age.includes(query)
      );
    });
  }, [patients, q]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Patients</h1>
            <p className="text-muted-foreground mt-1">
              Search and view patient records
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Refresh
          </Button>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Patient Directory
              <Badge variant="secondary" className="ml-2">
                {filtered.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, machine key, gender, age..."
                className="pl-9"
              />
            </div>

            {isError && (
              <div className="text-sm text-destructive">
                {(error as any)?.response?.data?.msg ||
                  (error as any)?.message ||
                  "Failed to load patients"}
              </div>
            )}

            <ScrollArea className="h-[520px] rounded-md border border-border">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  No patients found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Machine Key</TableHead>
                      <TableHead>Doctors</TableHead>
                      <TableHead>Nurses</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">
                          {p.name}
                        </TableCell>
                        <TableCell>{p.age ?? "—"}</TableCell>
                        <TableCell>
                          {p.gender ? (
                            <Badge variant="outline">{p.gender}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.machineKey}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {p.assignedDoctors?.length ?? 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {p.assignedNurses?.length ?? 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPatientsPage;
