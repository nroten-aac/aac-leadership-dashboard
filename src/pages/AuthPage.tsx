import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

const AuthPage = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (forgotPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email for a password reset link!");
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-card-hover border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <img src={logo} alt="Ashe Alliance Church" className="h-24 mx-auto" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {forgotPassword ? "Reset Password" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {forgotPassword
                ? "Enter your email to receive a reset link"
                : "Sign in to your leadership dashboard"}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@ashealliancechurch.org"
                required
              />
            </div>
            {!forgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}
            {!forgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-sm text-secondary hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : forgotPassword ? "Send Reset Link" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            {forgotPassword && (
              <button
                onClick={() => setForgotPassword(false)}
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                Back to sign in
              </button>
            )}
            {!forgotPassword && (
              <p className="text-xs text-muted-foreground mt-2">
                Access is by invitation only. Contact your administrator.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
