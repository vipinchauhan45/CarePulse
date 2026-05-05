// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { patientApi } from '@/services/api';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Skeleton } from '@/components/ui/skeleton';
// import { useToast } from '@/hooks/use-toast';
// import { FileText, Plus, AlertCircle, ClipboardList } from 'lucide-react';
// import { cn } from '@/lib/utils';

// interface MedicalHistoryPanelProps {
//   patientId: string;
//   initialHistory?: string[];
// }

// const MedicalHistoryPanel: React.FC<MedicalHistoryPanelProps> = ({
//   patientId,
//   initialHistory = [],
// }) => {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const [newEntry, setNewEntry] = useState('');
//   const [apiAvailable, setApiAvailable] = useState(true);
//   const [localHistory, setLocalHistory] = useState<string[]>([]);

//   // Fetch medical history
//   const { data, isLoading, isError } = useQuery({
//     queryKey: ['medical-history', patientId],
//     queryFn: () => patientApi.getMedicalHistory(patientId),
//     retry: 1,
//   });

//   // Handle API error
//   React.useEffect(() => {
//     if (isError) {
//       setApiAvailable(false);
//     }
//   }, [isError]);

//   // Add entry mutation
//   const addEntryMutation = useMutation({
//     mutationFn: (entry: string) => patientApi.addMedicalHistory(patientId, entry),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['medical-history', patientId] });
//       queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
//       setNewEntry('');
//       toast({
//         title: 'Success',
//         description: 'Medical history entry added',
//       });
//     },
//     onError: () => {
//       // Fallback to local storage
//       setLocalHistory((prev) => [...prev, newEntry]);
//       setNewEntry('');
//       setApiAvailable(false);
//       toast({
//         variant: 'destructive',
//         title: 'API Unavailable',
//         description: 'Entry saved locally',
//       });
//     },
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newEntry.trim()) return;

//     if (apiAvailable) {
//       addEntryMutation.mutate(newEntry);
//     } else {
//       setLocalHistory((prev) => [...prev, newEntry]);
//       setNewEntry('');
//     }
//   };

//   // Combine all history entries
//   const allHistory = [
//     ...localHistory,
//     ...(data?.medicalHistory || []),
//     ...initialHistory,
//   ].filter((entry, index, self) => self.indexOf(entry) === index);

//   return (
//     <Card className="border-border">
//       <CardHeader className="pb-3">
//         <CardTitle className="flex items-center gap-2 text-lg">
//           <FileText className="h-5 w-5 text-primary" />
//           Medical History
//         </CardTitle>
//         {!apiAvailable && (
//           <div className="flex items-center gap-2 text-xs text-warning">
//             <AlertCircle className="h-3 w-3" />
//             Medical History API pending - using local storage
//           </div>
//         )}
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {/* Add Entry Form */}
//         <form onSubmit={handleSubmit} className="space-y-2">
//           <Textarea
//             placeholder="Add a new medical history entry..."
//             value={newEntry}
//             onChange={(e) => setNewEntry(e.target.value)}
//             className="resize-none min-h-[80px]"
//           />
//           <Button
//             type="submit"
//             size="sm"
//             className="w-full gap-2"
//             disabled={!newEntry.trim() || addEntryMutation.isPending}
//           >
//             <Plus className="h-4 w-4" />
//             {addEntryMutation.isPending ? 'Adding...' : 'Add Entry'}
//           </Button>
//         </form>

//         {/* History List */}
//         <ScrollArea className="h-64">
//           {isLoading ? (
//             <div className="space-y-3">
//               {[1, 2, 3].map((i) => (
//                 <Skeleton key={i} className="h-12 w-full" />
//               ))}
//             </div>
//           ) : allHistory.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
//               <p className="text-sm">No medical history recorded</p>
//               <p className="text-xs">Add the first entry above</p>
//             </div>
//           ) : (
//             <div className="space-y-2 pr-2">
//               {allHistory.map((entry, index) => {
//                 const isLocal = localHistory.includes(entry);
//                 return (
//                   <div
//                     key={`${entry}-${index}`}
//                     className={cn(
//                       'p-3 rounded-lg border text-sm',
//                       isLocal
//                         ? 'border-warning/30 bg-warning/5'
//                         : 'border-border bg-muted/50'
//                     )}
//                   >
//                     <div className="flex items-start gap-2">
//                       <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
//                       <p className="text-foreground">{entry}</p>
//                     </div>
//                     {isLocal && (
//                       <p className="text-xs text-warning mt-2 ml-4">Saved locally</p>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </ScrollArea>
//       </CardContent>
//     </Card>
//   );
// };

// export default MedicalHistoryPanel;



// import React, { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { patientApi } from "@/services/api";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useToast } from "@/hooks/use-toast";
// import { FileText, Plus, ClipboardList } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface MedicalHistoryPanelProps {
//   patientId: string;
//   initialHistory?: string[];
// }

// const MedicalHistoryPanel: React.FC<MedicalHistoryPanelProps> = ({
//   patientId,
//   initialHistory = [],
// }) => {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const [newEntry, setNewEntry] = useState("");

//   const {
//     data,
//     isLoading,
//     isError,
//     error,
//   } = useQuery({
//     queryKey: ["medical-history", patientId],
//     queryFn: () => patientApi.getMedicalHistory(patientId),
//     enabled: !!patientId,
//     retry: 1,
//   });

//   const addEntryMutation = useMutation({
//     mutationFn: (entry: string) => patientApi.addMedicalHistory(patientId, entry),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["medical-history", patientId] });
//       queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
//       setNewEntry("");
//       toast({
//         title: "Success",
//         description: "Medical history entry added",
//       });
//     },
//     onError: (err: any) => {
//       const msg =
//         err?.response?.data?.msg ||
//         err?.message ||
//         "Could not add medical history entry";
//       toast({
//         variant: "destructive",
//         title: "Failed",
//         description: msg,
//       });
//     },
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     const entry = newEntry.trim();
//     if (!entry) return;
//     addEntryMutation.mutate(entry);
//   };

//   const history = (data?.medicalHistory?.length ? data.medicalHistory : initialHistory) || [];

//   return (
//     <Card className="border-border">
//       <CardHeader className="pb-3">
//         <CardTitle className="flex items-center gap-2 text-lg">
//           <FileText className="h-5 w-5 text-primary" />
//           Medical History
//         </CardTitle>

//         {isError && (
//           <div className="text-xs text-destructive">
//             {(error as any)?.response?.data?.msg ||
//               (error as any)?.message ||
//               "Failed to load medical history"}
//           </div>
//         )}
//       </CardHeader>

//       <CardContent className="space-y-4">
//         <form onSubmit={handleSubmit} className="space-y-2">
//           <Textarea
//             placeholder="Add a new medical history entry..."
//             value={newEntry}
//             onChange={(e) => setNewEntry(e.target.value)}
//             className="resize-none min-h-[80px]"
//           />
//           <Button
//             type="submit"
//             size="sm"
//             className="w-full gap-2"
//             disabled={!newEntry.trim() || addEntryMutation.isPending}
//           >
//             <Plus className="h-4 w-4" />
//             {addEntryMutation.isPending ? "Adding..." : "Add Entry"}
//           </Button>
//         </form>

//         <ScrollArea className="h-64">
//           {isLoading ? (
//             <div className="space-y-3">
//               {[1, 2, 3].map((i) => (
//                 <Skeleton key={i} className="h-12 w-full" />
//               ))}
//             </div>
//           ) : history.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
//               <p className="text-sm">No medical history recorded</p>
//               <p className="text-xs">Add the first entry above</p>
//             </div>
//           ) : (
//             <div className="space-y-2 pr-2">
//               {history.map((entry, index) => (
//                 <div
//                   key={`${index}-${entry}`}
//                   className={cn("p-3 rounded-lg border text-sm border-border bg-muted/50")}
//                 >
//                   <div className="flex items-start gap-2">
//                     <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
//                     <p className="text-foreground">{entry}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </ScrollArea>
//       </CardContent>
//     </Card>
//   );
// };

// export default MedicalHistoryPanel;




import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalHistoryPanelProps {
  patientId: string;
  initialHistory?: string[];
}

const MedicalHistoryPanel: React.FC<MedicalHistoryPanelProps> = ({
  patientId,
  initialHistory = [],
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEntry, setNewEntry] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["medical-history", patientId],
    queryFn: () => patientApi.getMedicalHistory(patientId),
    enabled: !!patientId,
    retry: 1,
  });

  const addEntryMutation = useMutation({
    mutationFn: (entry: string) => patientApi.addMedicalHistory(patientId, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-history", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      setNewEntry("");
      toast({ title: "Success", description: "Medical history entry added" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Failed",
        description:
          err?.response?.data?.msg ||
          err?.message ||
          "Could not add medical history entry",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = newEntry.trim();
    if (!entry) return;
    addEntryMutation.mutate(entry);
  };

  const history = (data?.medicalHistory ?? initialHistory) || [];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Medical History
        </CardTitle>

        {isError && (
          <div className="text-xs text-destructive">
            {(error as any)?.response?.data?.msg ||
              (error as any)?.message ||
              "Failed to load medical history"}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a new medical history entry..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            className="resize-none min-h-[80px]"
          />
          <Button
            type="submit"
            size="sm"
            className="w-full gap-2"
            disabled={!newEntry.trim() || addEntryMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            {addEntryMutation.isPending ? "Adding..." : "Add Entry"}
          </Button>
        </form>

        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No medical history recorded</p>
              <p className="text-xs">Add the first entry above</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {history.map((entry, index) => (
                <div
                  key={`${index}-${entry}`}
                  className={cn("p-3 rounded-lg border text-sm border-border bg-muted/50")}
                >
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-foreground">{entry}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MedicalHistoryPanel;
