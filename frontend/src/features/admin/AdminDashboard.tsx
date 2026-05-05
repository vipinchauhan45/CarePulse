// import React from 'react';
// import { Link } from 'react-router-dom';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Users, UserPlus, Activity, ShieldCheck } from 'lucide-react';

// const AdminDashboard: React.FC = () => {
//   return (
//     <DashboardLayout>
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
//           <p className="text-muted-foreground mt-1">
//             Manage staff members and system settings
//           </p>
//         </div>

//         {/* Quick Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <Card className="border-border">
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">
//                 System Status
//               </CardTitle>
//               <Activity className="h-4 w-4 text-success" />
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center gap-2">
//                 <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
//                 <span className="text-2xl font-bold text-foreground">Online</span>
//               </div>
//               <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
//             </CardContent>
//           </Card>

//           <Card className="border-border">
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">
//                 Security
//               </CardTitle>
//               <ShieldCheck className="h-4 w-4 text-primary" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-foreground">Protected</div>
//               <p className="text-xs text-muted-foreground mt-1">Role-based access enabled</p>
//             </CardContent>
//           </Card>

//           <Card className="border-border">
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">
//                 Quick Actions
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <Link to="/admin/add-staff">
//                 <Button size="sm" className="w-full">
//                   <UserPlus className="h-4 w-4 mr-2" />
//                   Add New Staff
//                 </Button>
//               </Link>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Quick Actions Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <Link to="/admin/add-staff">
//             <Card className="border-border card-interactive cursor-pointer h-full">
//               <CardHeader>
//                 <div className="flex items-center gap-4">
//                   <div className="p-3 bg-primary/10 rounded-xl">
//                     <UserPlus className="h-8 w-8 text-primary" />
//                   </div>
//                   <div>
//                     <CardTitle className="text-xl">Add Staff Member</CardTitle>
//                     <CardDescription>
//                       Create new doctor, nurse, or admin accounts
//                     </CardDescription>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <ul className="text-sm text-muted-foreground space-y-1">
//                   <li>• Register new doctors</li>
//                   <li>• Register new nurses</li>
//                   <li>• Create admin accounts</li>
//                 </ul>
//               </CardContent>
//             </Card>
//           </Link>

//           <Link to="/admin/staff">
//             <Card className="border-border card-interactive cursor-pointer h-full">
//               <CardHeader>
//                 <div className="flex items-center gap-4">
//                   <div className="p-3 bg-success/10 rounded-xl">
//                     <Users className="h-8 w-8 text-success" />
//                   </div>
//                   <div>
//                     <CardTitle className="text-xl">View All Staff</CardTitle>
//                     <CardDescription>
//                       Manage existing staff members
//                     </CardDescription>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <ul className="text-sm text-muted-foreground space-y-1">
//                   <li>• View staff directory</li>
//                   <li>• Edit staff details</li>
//                   <li>• Remove staff accounts</li>
//                 </ul>
//               </CardContent>
//             </Card>
//           </Link>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default AdminDashboard;




import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Activity, ShieldCheck, ClipboardList } from "lucide-react";

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage staff members and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-2xl font-bold text-foreground">Online</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Security</CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Protected</div>
              <p className="text-xs text-muted-foreground mt-1">Role-based access enabled</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/admin/add-staff">
                <Button size="sm" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Staff
                </Button>
              </Link>

              <Link to="/admin/patients">
                <Button size="sm" variant="outline" className="w-full">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  View All Patients
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/add-staff">
            <Card className="border-border card-interactive cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Add Staff Member</CardTitle>
                    <CardDescription>Create new doctor, nurse, or admin accounts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Register new doctors</li>
                  <li>• Register new nurses</li>
                  <li>• Create admin accounts</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/staff">
            <Card className="border-border card-interactive cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/10 rounded-xl">
                    <Users className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">View All Staff</CardTitle>
                    <CardDescription>Manage existing staff members</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View staff directory</li>
                  <li>• Edit staff details</li>
                  <li>• Remove staff accounts</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/patients">
            <Card className="border-border card-interactive cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-warning/10 rounded-xl">
                    <ClipboardList className="h-8 w-8 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">View All Patients</CardTitle>
                    <CardDescription>Browse and manage patient records</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View patient directory</li>
                  <li>• Open patient profiles</li>
                  <li>• Discharge patients</li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
