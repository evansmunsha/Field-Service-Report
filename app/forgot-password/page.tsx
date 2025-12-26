"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate reset token");
        return;
      }

      setResetToken(data.resetToken);
      toast.success("Reset token generated successfully!");
    } catch (err) {
      setError("Failed to generate reset token. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(resetToken);
      toast.success("Token copied to clipboard!");
    } catch {
      toast.error("Failed to copy token");
    }
  };

  const handleResetNow = () => {
    router.push(`/reset-password?token=${resetToken}`);
  };

  if (resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/40">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Image
                src="/logo.png"
                alt="Field Service Report"
                width={48}
                height={48}
                className="mx-auto rounded-lg"
              />
            </div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Reset Token Generated
            </CardTitle>
            <CardDescription>
              Use this token to reset your password. It expires in 1 hour.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Keep this token safe and don&apos;t share it with anyone. It
                will only be shown once.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your Reset Token:</Label>
              <div className="flex gap-2">
                <Input
                  value={resetToken}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToken}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleResetNow} className="w-full">
                Reset Password Now
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setResetToken("");
                  setEmail("");
                }}
              >
                Generate New Token
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              <Link
                href="/signin"
                className="text-foreground hover:underline font-medium"
              >
                Back to Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/40">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image
              src="/logo.png"
              alt="Field Service Report"
              width={64}
              height={64}
              className="mx-auto rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll generate a reset token for
            you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Generating Token..." : "Generate Reset Token"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Remember your password?{" "}
            <Link
              href="/signin"
              className="text-foreground hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
