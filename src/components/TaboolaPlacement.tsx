interface TaboolaPlacementProps {
  containerId: string;
  mode: string;
  placement: string;
  className?: string;
  targetType?: string;
}

export default function TaboolaPlacement({
  containerId,
  mode,
  placement,
  className = "",
  targetType = "mix",
}: TaboolaPlacementProps) {
  return (
    <>
      <div id={containerId} className={className} />
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `
            window._taboola = window._taboola || [];
            _taboola.push({
              mode: ${JSON.stringify(mode)},
              container: ${JSON.stringify(containerId)},
              placement: ${JSON.stringify(placement)},
              target_type: ${JSON.stringify(targetType)}
            });
          `,
        }}
      />
    </>
  );
}
