export default function TaboolaFlush() {
  return (
    <script
      id="taboola-flush"
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `
        window._taboola = window._taboola || [];
        _taboola.push({flush: true});
      `,
      }}
    />
  );
}
