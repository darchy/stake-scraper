/**
 * Round-number domain and ticks covering [min, max], about `steps` steps apart.
 * Shared by the metric charts and the earnings bars.
 */
export function niceScale(min: number, max: number, steps = 4) {
  if (min === max) max = min + 1;
  const step = niceStep((max - min) / steps);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { domain: [lo, hi] as [number, number], ticks };
}

/** Rounds a raw step up to 1, 2, 2.5 or 5 times a power of ten. */
function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}
