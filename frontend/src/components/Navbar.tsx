import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/AuthContext";
import { Button } from "@/components/ui/button";
import { wsService } from "@/services/websocket";
import { alertApi } from "@/services/api";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Activity,
  LogOut,
  User,
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  Menu,
  ClipboardList,
  Bell,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface AlertPayload {
  type: "alert";
  alertId: string;
  severity: "high" | "critical";
  patientId: string;
  patientName: string;
  vitals: any;
  createdAt: string;
  alertTypes: string[];
  acknowledged: boolean;
}

interface NavbarProps {
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  showSidebar = false,
  onToggleSidebar,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  const handleAlertClick = async (alert: AlertPayload) => {
    try {
      // Call backend
      await alertApi.acknowledgeAlert(alert.alertId);

      // Update UI
      setAlerts((prev) =>
        prev.map((a) =>
          a.alertId === alert.alertId ? { ...a, acknowledged: true } : a,
        ),
      );

      // Navigate
      if (user?.role === "admin") {
        navigate(`/admin/patient/${alert.patientId}`);
      } else {
        navigate(`/staff/patient/${alert.patientId}`);
      }
    } catch (err) {
      console.error("Failed to acknowledge alert", err);
    }
  };
  // 1. Load existing alerts (API)
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await alertApi.getActiveAlerts();

        setAlerts(
          res.data.map((a) => ({
            type: "alert",
            alertId: a._id,
            severity: a.severity,
            patientId: a.patientId,
            patientName: a.patientName,
            vitals: a.vitals,
            createdAt: a.createdAt,
            alertTypes: a.alertTypes || [],
            acknowledged: a.acknowledged ?? false,
          })),
        );
      } catch (err) {
        console.error("Failed to load alerts", err);
      }
    };

    loadAlerts();
  }, []);

  // 2. WebSocket listeners (real-time)
  useEffect(() => {
    const unsubscribeAlert = wsService.onAlert((data: any) => {
      setAlerts((prev) => {
        const exists = prev.find((a) => a.alertId === data.alertId);
        if (exists) return prev;

        return [
          {
            type: "alert",
            alertId: data.alertId,
            severity: data.severity,
            patientId: data.patientId,
            patientName: data.patientName,
            vitals: data.vitals,
            createdAt: data.createdAt,
            alertTypes: data.alertTypes || [],
            acknowledged: false,
          },
          ...prev,
        ];
      });
    });

    const unsubscribeRecovery = wsService.onRecovery((data) => {
      setAlerts((prev) => prev.filter((a) => a.patientId !== data.patientId));
    });

    return () => {
      unsubscribeAlert();
      unsubscribeRecovery();
    };
  }, []);

  const handleLogout = () => {
    wsService.disconnect();
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  const navLinks = isAdmin
    ? [
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin/patients", label: "All Patients", icon: ClipboardList },
        { to: "/admin/staff", label: "Staff List", icon: Users },
        { to: "/admin/add-staff", label: "Add Staff", icon: UserPlus },
      ]
    : [{ to: "/staff", label: "Patients", icon: Stethoscope }];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-primary/10 text-primary";
      case "doctor":
        return "bg-success/10 text-success";
      case "nurse":
        return "bg-vital-oxygen/10 text-vital-oxygen";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {showSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link
            to={isAdmin ? "/admin" : "/staff"}
            className="flex items-center gap-2"
          >
            <div className="p-2 bg-primary rounded-lg">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline-block font-semibold text-foreground">
              CarePulse
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />

                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 max-h-96 overflow-y-auto"
            >
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {alerts.length === 0 ? (
                <DropdownMenuItem>No alerts</DropdownMenuItem>
              ) : (
                alerts.map((alert) => (
                  <DropdownMenuItem
                    key={alert.alertId}
                    onClick={() => handleAlertClick(alert)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span
                        className={`text-sm ${
                          alert.acknowledged ? "font-normal" : "font-bold"
                        }`}
                      >
                        {alert.severity.toUpperCase()} - {alert.patientName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-1 px-1.5 py-0.5 rounded-full w-fit capitalize",
                      getRoleBadgeColor(user?.role || ""),
                    )}
                  >
                    {user?.role}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
