import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import VitalCard from "./components/VitalCard";
import VitalChart from "./components/VitalChart";
import NotesPanel from "./components/NotesPanel";
import MedicalHistoryPanel from "./components/MedicalHistoryPanel";
import AssignStaffModal from "./components/AssignStaffModal";
import DischargeDialog from "./components/DischargeDialog";
import VitalsHistoryTable from "./components/VitalsHistoryTable";
import { patientApi, vitalsApi } from "@/services/api";
import { wsService } from "@/services/websocket";
import { useAuth } from "@/store/AuthContext";
import { Vitals, VitalDataPoint } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Gauge,
  Wind,
  Wifi,
  WifiOff,
  Pause,
  Play,
  RefreshCw,
  Stethoscope,
  UserCheck,
  AlertCircle,
  UserPlus,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_DATA_POINTS = 60;

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liveVitals, setLiveVitals] = useState<Vitals | null>(null);
  const [ecgSeries, setEcgSeries] = useState<VitalDataPoint[]>([]);
  const [vitalSeries, setVitalSeries] = useState<VitalDataPoint[]>([]);
  const [activeTab, setActiveTab] = useState("live");
  const [historyLimit, setHistoryLimit] = useState(500);

  // Modals
  const [assignDoctorOpen, setAssignDoctorOpen] = useState(false);
  const [assignNurseOpen, setAssignNurseOpen] = useState(false);
  const [dischargeOpen, setDischargeOpen] = useState(false);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Fetch patient data
  const {
    data: patient,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientApi.getPatientById(id!),
    enabled: !!id,
  });

  // Fetch historical vitals
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["vitals-history", id, historyLimit],
    queryFn: () => vitalsApi.getHistory(id!, historyLimit),
    enabled: !!id && activeTab === "history",
  });

  // Discharge mutation
  const dischargeMutation = useMutation({
    mutationFn: () => patientApi.dischargePatient(id!),
    onSuccess: () => {
      toast({
        title: "Patient Discharged",
        description: "Patient has been moved to discharged list",
      });
      localStorage.removeItem("last_patient_id");
      localStorage.removeItem("last_machine_key");
      navigate("/staff");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to discharge patient",
      });
    },
  });

  const decodeEcgWaveform = (encoded?: string): number[] => {
    if (!encoded) return [];

    try {
      const decoded = atob(encoded);
      return decoded.split(",").map(Number);
    } catch (error) {
      console.error("ECG decode failed", error);
      return [];
    }
  };

  // Check if user can assign staff
  const canAssignStaff = useCallback(() => {
    if (!user || !patient) return false;

    // Admin can always assign
    if (user.role === "admin") return true;

    // Check if user is assigned to this patient
    const isAssignedDoctor = patient.assignedDoctors?.some(
      (d) => d._id === user._id,
    );
    const isAssignedNurse = patient.assignedNurses?.some(
      (n) => n._id === user._id,
    );

    return isAssignedDoctor || isAssignedNurse;
  }, [user, patient]);

  // Handle vital updates from WebSocket
  const handleVitalUpdate = useCallback((vitals: Vitals) => {
    setLiveVitals(vitals);

    if (!isPausedRef.current) {
      const newPoint: VitalDataPoint = {
        timestamp: Date.now(),
        heartRate: vitals.heartRate,
        oxygenSaturation: vitals.oxygenSaturation,
        temperature: vitals.temperature,
        meanArterialPressure: vitals.meanArterialPressure,
        respiratoryRate: vitals.respiratoryRate,
      };

      setVitalSeries((prev) => {
        const updated = [...prev, newPoint];
        return updated.slice(-MAX_DATA_POINTS);
      });

      if (vitals.ecgWaveform) {
        const samples = decodeEcgWaveform(vitals.ecgWaveform);

        setEcgSeries((prev) => {
          const now = Date.now();

          const points: VitalDataPoint[] = samples.map((value, index) => ({
            timestamp: now + index,
            ecgValue: value,
          }));

          return [...prev, ...points].slice(-300);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!patient?.machineKey || !id) return;

    const unsubVital = wsService.onVitalUpdate((pid, vitals) => {
      if (pid !== id) return;
      handleVitalUpdate(vitals);
    });

    const unsubConnection = wsService.onConnectionChange(setIsConnected);
    const unsubError = wsService.onError((error) => {
      console.error("WebSocket error:", error);
    });

    // Just join this patient's room (WS already connected globally)
    wsService.join(patient.machineKey, id);

    return () => {
      unsubVital();
      unsubConnection();
      unsubError();
      wsService.leave(patient.machineKey, id);
    };
  }, [patient?.machineKey, id, handleVitalUpdate]);

  const handleReconnect = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    wsService.connect(token);
    if (patient?.machineKey && id) wsService.join(patient.machineKey, id);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !patient) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/staff")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-xl font-semibold">Patient Not Found</h3>
              <p className="text-muted-foreground mt-2">
                The patient you're looking for doesn't exist or you don't have
                access.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/staff")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {patient.name}
              </h1>
              <p className="text-muted-foreground">
                {patient.age} years • {patient.gender} •
                <code className="ml-2 px-2 py-0.5 bg-muted rounded text-xs font-mono">
                  {patient.machineKey}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Connection Status */}
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5",
                isConnected
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-destructive/10 text-destructive border-destructive/20",
              )}
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Disconnected
                </>
              )}
            </Badge>

            {!isConnected && (
              <Button variant="outline" size="sm" onClick={handleReconnect}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect
              </Button>
            )}

            <Button
              variant={isPaused ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Patient Info & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-lg border bg-card">
          {/* Assigned Staff */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Doctors:</span>
              {patient.assignedDoctors?.length > 0 ? (
                patient.assignedDoctors.map((doc) => (
                  <Badge key={doc._id} variant="secondary" className="text-xs">
                    {doc.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  None assigned
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-vital-oxygen" />
              <span className="text-sm text-muted-foreground">Nurses:</span>
              {patient.assignedNurses?.length > 0 ? (
                patient.assignedNurses.map((nurse) => (
                  <Badge
                    key={nurse._id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {nurse.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  None assigned
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canAssignStaff() && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignDoctorOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Doctor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignNurseOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Nurse
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDischargeOpen(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Discharge
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Vitals & Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Vitals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <VitalCard
                label="Heart Rate"
                value={liveVitals?.heartRate ?? "--"}
                unit="bpm"
                icon={Heart}
                color="heart"
                isLive={isConnected && !isPaused}
              />
              <VitalCard
                label="SpO₂"
                value={liveVitals?.oxygenSaturation ?? "--"}
                unit="%"
                icon={Droplets}
                color="oxygen"
                isLive={isConnected && !isPaused}
              />
              <VitalCard
                label="Temperature"
                value={liveVitals?.temperature?.toFixed(1) ?? "--"}
                unit="°C"
                icon={Thermometer}
                color="temp"
                isLive={isConnected && !isPaused}
              />
              <VitalCard
                label="MAP"
                value={liveVitals?.meanArterialPressure ?? "--"}
                unit="mmHg"
                icon={Gauge}
                color="pressure"
                isLive={isConnected && !isPaused}
              />
              <VitalCard
                label="Resp Rate"
                value={liveVitals?.respiratoryRate ?? "--"}
                unit="/min"
                icon={Wind}
                color="respiratory"
                isLive={isConnected && !isPaused}
              />
            </div>

            {/* Blood Pressure Card */}
            {liveVitals?.bloodPressure && (
              <Card className="border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-vital-pressure/10 rounded-lg">
                      <Activity className="h-5 w-5 text-vital-pressure" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Blood Pressure
                      </p>
                      <p className="text-2xl font-bold font-mono">
                        {liveVitals.bloodPressure}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>EtCO₂: {liveVitals.endTidalCO2} mmHg</p>
                    <p>FiO₂: {liveVitals.fiO2}%</p>
                    <p>CVP: {liveVitals.centralVenousPressure} mmHg</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="live">Live Charts</TabsTrigger>
                <TabsTrigger value="history">Vitals History</TabsTrigger>
                <TabsTrigger value="medical">Medical History</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-4 mt-4">
                <VitalChart
                  title="Heart Rate"
                  data={vitalSeries}
                  dataKey="heartRate"
                  color="hsl(var(--vital-heart))"
                  unit="bpm"
                />
                <VitalChart
                  title="Oxygen Saturation"
                  data={vitalSeries}
                  dataKey="oxygenSaturation"
                  color="hsl(var(--vital-oxygen))"
                  unit="%"
                  domain={[90, 100]}
                />
                <VitalChart
                  title="Mean Arterial Pressure"
                  data={vitalSeries}
                  dataKey="meanArterialPressure"
                  color="hsl(var(--vital-pressure))"
                  unit="mmHg"
                />
                <VitalChart
                  title="ECG Waveform"
                  data={ecgSeries}
                  dataKey="ecgValue"
                  color="hsl(var(--vital-heart))"
                  unit="mV"
                />
              </TabsContent>

              <TabsContent value="history" className="mt-4 space-y-4">
                {/* History Controls */}

                {/* <TabsContent value="history" className="mt-4 space-y-6"> */}
                  {/* 🔹 Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Limit:
                      </span>
                      <Select
                        value={historyLimit.toString()}
                        onValueChange={(v) => setHistoryLimit(Number(v))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="200">200 records</SelectItem>
                          <SelectItem value="500">500 records</SelectItem>
                          <SelectItem value="1000">1000 records</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {historyData && (
                      <span className="text-sm text-muted-foreground">
                        Showing {historyData.data?.length || 0} of{" "}
                        {historyData.total || 0} records
                      </span>
                    )}
                  </div>

                  {/* 🔹 Loading */}
                  {isLoadingHistory ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48" />
                      ))}
                    </div>
                  ) : historyData?.data?.length ? (
                    <div className="space-y-6">
                      {/* MULTIPLE HISTORY GRAPHS */}
                      <VitalChart
                        title="Heart Rate History"
                        data={historyData.data.map((v) => ({
                          timestamp: new Date(v.recordedAt).getTime(),
                          heartRate: v.heartRate,
                          oxygenSaturation: v.oxygenSaturation,
                          temperature: v.temperature,
                          meanArterialPressure: v.meanArterialPressure,
                          respiratoryRate: v.respiratoryRate,
                        }))}
                        dataKey="heartRate"
                        color="hsl(var(--vital-heart))"
                        unit="bpm"
                      />

                      <VitalChart
                        title="Oxygen Saturation History"
                        data={historyData.data.map((v) => ({
                          timestamp: new Date(v.recordedAt).getTime(),
                          heartRate: v.heartRate,
                          oxygenSaturation: v.oxygenSaturation,
                          temperature: v.temperature,
                          meanArterialPressure: v.meanArterialPressure,
                          respiratoryRate: v.respiratoryRate,
                        }))}
                        dataKey="oxygenSaturation"
                        color="hsl(var(--vital-oxygen))"
                        unit="%"
                        domain={[85, 100]}
                      />

                      <VitalChart
                        title="Mean Arterial Pressure History"
                        data={historyData.data.map((v) => ({
                          timestamp: new Date(v.recordedAt).getTime(),
                          heartRate: v.heartRate,
                          oxygenSaturation: v.oxygenSaturation,
                          temperature: v.temperature,
                          meanArterialPressure: v.meanArterialPressure,
                          respiratoryRate: v.respiratoryRate,
                        }))}
                        dataKey="meanArterialPressure"
                        color="hsl(var(--vital-pressure))"
                        unit="mmHg"
                      />
                      <VitalChart
                        title="ECG Waveform History"
                        data={historyData.data.flatMap((v) => {
                          if (!v.ecgWaveform) return [];

                          const samples = decodeEcgWaveform(v.ecgWaveform);

                          return samples.map((sample, index) => ({
                            timestamp: new Date(v.recordedAt).getTime() + index,
                            ecgValue: sample,
                          }));
                        })}
                        dataKey="ecgValue"
                        color="hsl(var(--vital-heart))"
                        unit="mV"
                      />
                      {/* TABLE BELOW GRAPHS */}
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold mb-4">
                            Vitals History Table
                          </h3>

                          <div className="max-h-[400px] overflow-y-auto border rounded-md">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-muted">
                                <tr>
                                  <th className="p-2 text-left">Time</th>
                                  <th className="p-2">HR</th>
                                  <th className="p-2">SpO₂</th>
                                  <th className="p-2">Temp</th>
                                  <th className="p-2">MAP</th>
                                  <th className="p-2">RR</th>
                                </tr>
                              </thead>

                              <tbody>
                                {historyData.data.map((v, index) => {
                                  const isCritical =
                                    v.heartRate > 130 ||
                                    v.oxygenSaturation < 90 ||
                                    v.meanArterialPressure < 65;

                                  return (
                                    <tr
                                      key={index}
                                      className={`border-t ${
                                        isCritical
                                          ? "bg-red-100 text-red-700 font-semibold"
                                          : ""
                                      }`}
                                    >
                                      <td className="p-2">
                                        {new Date(
                                          v.recordedAt,
                                        ).toLocaleString()}
                                      </td>
                                      <td className="p-2 text-center">
                                        {v.heartRate}
                                      </td>
                                      <td className="p-2 text-center">
                                        {v.oxygenSaturation}
                                      </td>
                                      <td className="p-2 text-center">
                                        {v.temperature}
                                      </td>
                                      <td className="p-2 text-center">
                                        {v.meanArterialPressure}
                                      </td>
                                      <td className="p-2 text-center">
                                        {v.respiratoryRate}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="border-border">
                      <CardContent className="p-12 text-center">
                        <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                          No historical data available yet
                        </p>
                      </CardContent>
                    </Card>
                  )}
                {/* </TabsContent> */}
              </TabsContent>

              <TabsContent value="medical" className="mt-4">
                <MedicalHistoryPanel
                  patientId={id!}
                  initialHistory={patient.medicalHistory || []}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Notes Panel */}
          <div className="lg:col-span-1">
            <NotesPanel patientId={id!} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignStaffModal
        isOpen={assignDoctorOpen}
        onClose={() => setAssignDoctorOpen(false)}
        patientId={id!}
        type="doctor"
      />
      <AssignStaffModal
        isOpen={assignNurseOpen}
        onClose={() => setAssignNurseOpen(false)}
        patientId={id!}
        type="nurse"
      />
      <DischargeDialog
        isOpen={dischargeOpen}
        onClose={() => setDischargeOpen(false)}
        onConfirm={() => dischargeMutation.mutate()}
        patientName={patient.name}
        isLoading={dischargeMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default PatientDetailPage;
