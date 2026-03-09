import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL hash for recovery token (handles case where event fires before listener)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Also listen for the auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check if there's already a session (user clicked link and was auto-logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && hash.includes("type=recovery")) {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/");
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-card-hover border-0">
          <CardHeader className="text-center space-y-4 pb-2">
            <img src={logo} alt="Ashe Alliance Church" className="h-24 mx-auto" />
            <h1 className="text-2xl font-display font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground text-sm">
              Verifying your recovery link…
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-card-hover border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <img src={logo} alt="Ashe Alliance Church" className="h-24 mx-auto" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Set New Password</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter your new password below</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
