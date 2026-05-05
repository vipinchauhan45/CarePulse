import React, { useEffect } from "react";
import Navbar from "./Navbar";
import { wsService } from "@/services/websocket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) wsService.connect(token);

    // unlock sound on first click (browser rule)
    const unlock = () => {
      wsService.unlockAudio();
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("click", unlock);

    const unsubAlert = wsService.onAlert((a) => {
      toast({
        variant: "destructive",
        title: ` ${a.severity.toUpperCase()} Alert: ${a.patientName}`,
        description: `HR ${a.vitals.heartRate} | SpO₂ ${a.vitals.oxygenSaturation} | MAP ${a.vitals.meanArterialPressure}`,
        action: (
          <Button variant="secondary" size="sm" onClick={() => navigate(`/staff/patient/${a.patientId}`)}>
            View
          </Button>
        ),
      });
    });

    const unsubRecovery = wsService.onRecovery((r) => {
      toast({
        title: ` Recovery: ${r.patientName}`,
        description: "Vitals returned to normal range",
      });
    });

    return () => {
      document.removeEventListener("click", unlock);
      unsubAlert();
      unsubRecovery();
    };
  }, [toast, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
};

export default DashboardLayout;
