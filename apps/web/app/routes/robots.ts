export function loader() {
  const body = ["User-agent: *", "Allow: /$", "Disallow: /auth/", "Disallow: /health", "", "Sitemap: https://camping-scout.example.com/sitemap.xml", ""].join(
    "\n",
  );

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
