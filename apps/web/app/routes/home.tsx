import { Link, useFetcher } from "react-router";

import { Button } from "@camping-scout/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@camping-scout/ui/components/card";
import type { Route } from "./+types/home";
import { getAuthenticatedUser } from "~/services/auth.service.server";
import { runAvailabilityScan } from "~/services/scan.service.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthenticatedUser(request);
  return { user };
}

export async function action() {
  const scan = await runAvailabilityScan();
  return { scan };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const scanning = fetcher.state !== "idle";
  const scan = fetcher.data?.scan;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="text-sm font-semibold">
            Camping Scout
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user.firstName}</span>
                <Button variant="outline" size="sm" asChild>
                  <a href="/auth/logout">Log out</a>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <a href="/auth/login">Log in</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Find open California campsites</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Camping Scout checks ReserveCalifornia for openings that match the dates you care about. Right now it runs a fixed search:
            Crystal Cove — Moro Campground, any Saturday night in the next 6 months.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Availability scan</CardTitle>
            <CardDescription>Crystal Cove — Moro Campground (tent/RV) · Sat→Sun (1 night) · next 180 days</CardDescription>
          </CardHeader>
          <CardContent>
            <fetcher.Form method="post">
              <Button type="submit" disabled={scanning}>
                {scanning ? "Scanning… (takes ~15 seconds)" : "Scan availability"}
              </Button>
            </fetcher.Form>

            {scan && (
              <div className="mt-6 space-y-6">
                {scan.locations.map((loc) => (
                  <div key={loc.facilityId}>
                    <h2 className="text-sm font-medium">
                      {loc.facilityName}
                      {loc.rangeStart && loc.rangeEnd && (
                        <span className="ml-2 font-normal text-muted-foreground">
                          bookable {loc.rangeStart} → {loc.rangeEnd} · {loc.siteCount} sites
                        </span>
                      )}
                    </h2>

                    {loc.error ? (
                      <p className="mt-2 text-sm text-destructive">Scan failed: {loc.error}</p>
                    ) : loc.openings.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No matching openings right now. Cancellations appear constantly — try again later.
                      </p>
                    ) : (
                      <ul className="mt-3 divide-y rounded-lg border">
                        {loc.openings.map((o) => (
                          <li key={`${o.checkin}-${o.patternLabel}`} className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-baseline sm:gap-3">
                            <span className="font-medium tabular-nums">{o.checkin}</span>
                            <span className="text-muted-foreground">{o.patternLabel}</span>
                            <span className="text-muted-foreground">
                              {o.sites.length} site{o.sites.length > 1 ? "s" : ""}: {o.sites.map((s) => s.name).join(", ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                <p className="text-xs text-muted-foreground">
                  Ran at {new Date(scan.ranAt).toLocaleString()} · {scan.totalOpenings} matching check-in date(s) · book at{" "}
                  <a href="https://www.reservecalifornia.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    reservecalifornia.com
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
