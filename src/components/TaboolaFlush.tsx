import Script from "next/script";

export default function TaboolaFlush() {
  return (
    <Script id="taboola-flush" strategy="afterInteractive">
      {`
        window._taboola = window._taboola || [];
        window._taboola.push({ flush: true });
      `}
    </Script>
  );
}
