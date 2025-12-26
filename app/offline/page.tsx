"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Try to reload the page
      window.location.reload();
    } catch (error) {
      console.error("Retry failed:", error);
      setIsRetrying(false);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/40">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image
              src="/logo.png"
              alt="Field Service Report"
              width={64}
              height={64}
              className="mx-auto rounded-lg mb-2"
            />
            <div className="p-3 rounded-full bg-muted w-fit mx-auto">
              <WifiOff className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">You&apos;re Offline</CardTitle>
          <CardDescription>
            It looks like you&apos;re not connected to the internet. Some
            features may not be available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOnline ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Connection restored! You can now retry loading the page.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No internet connection detected. Please check your network
                settings.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">What you can do:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try connecting to a different network</li>
              <li>• Wait for your connection to be restored</li>
              <li>• View previously cached content</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>

            <Button variant="outline" onClick={goBack} className="w-full">
              Go Back
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Field Service Report works offline with cached data.</p>
            <p>New entries will sync when you&apos;re back online.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
