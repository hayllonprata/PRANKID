type Slice = { label: string; count: number };

const COLORS = ["#ffe600", "#ff2d95", "#3cf0ff", "#7dffb3", "#ff8fab", "#c4b5fd", "#fbbf24", "#38bdf8"];

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function AccessPieChart({
  title,
  slices,
  empty,
}: {
  title: string;
  slices: Slice[];
  empty: string;
}) {
  const total = slices.reduce((sum, item) => sum + item.count, 0);
  let angle = 0;
  const paths = slices.map((slice, index) => {
    const sweep = total ? (slice.count / total) * 360 : 0;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...slice, start, end, color: COLORS[index % COLORS.length] };
  });

  return (
    <article className="panel-card access-chart">
      <h2>{title}</h2>
      {total === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <div className="access-chart-body">
          <svg viewBox="0 0 160 160" className="access-pie" role="img" aria-label={title}>
            {paths.length === 1 ? (
              <circle cx="80" cy="80" r="70" fill={paths[0].color} />
            ) : (
              paths.map((item) => (
                <path key={item.label} d={slicePath(80, 80, 70, item.start, item.end)} fill={item.color} />
              ))
            )}
          </svg>
          <ul className="access-pie-legend">
            {paths.map((item) => (
              <li key={item.label}>
                <span className="access-pie-swatch" style={{ background: item.color }} />
                <span>
                  {item.label}{" "}
                  <strong>
                    {item.count} ({Math.round((item.count / total) * 100)}%)
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
