import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-muted rounded-full">
            <Activity className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Link to="/login">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
