import * as React from "react";
import { Link } from "react-router";

import { Button } from "@campingmeow/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@campingmeow/ui/components/card";
import { ErrorLookup } from "~/lib/errors";

type RouteErrorPanelProps = {
  microLabel?: React.ReactNode;
  status: number;
  message: string;
  description?: React.ReactNode;
  returnTo?: { to: string; label: string };
};

export function RouteErrorPanel({
  microLabel,
  status,
  message,
  description,
  returnTo = { to: "/", label: "← Back to home" },
}: RouteErrorPanelProps) {
  const { defaultMicroLabel, defaultDescription } = ErrorLookup(status);

  return (
    <div className="min-h-screen">
      <main id="main" className="mx-auto max-w-3xl px-6 py-24">
        <Card role="alert">
          <CardHeader>
            <CardDescription>{microLabel || defaultMicroLabel}</CardDescription>
            <CardTitle>
              {status} · {message}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{description || defaultDescription}</p>
            <div className="mt-6">
              <Button variant="outline" size="sm" asChild>
                <Link to={returnTo.to}>{returnTo.label}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
