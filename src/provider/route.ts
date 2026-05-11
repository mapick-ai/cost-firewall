/**
 * mapick/<upstream>/<model> route resolution
 */

export interface RouteInfo {
  upstream: string;
  model: string;
}

export function parseMapickModelRef(ref: string): RouteInfo | null {
  if (!ref.startsWith("mapick/")) return null;

  const parts = ref.slice("mapick/".length).split("/");
  if (parts.length < 2) return null;

  const upstream = parts[0];
  const model = parts.slice(1).join("/");

  if (!upstream || !model) return null;

  return { upstream, model };
}

export function isMapickModelRef(ref: string): boolean {
  return ref.startsWith("mapick/");
}
