import { useEffect, useState } from 'react';

export interface CityData {
  v: number;
  roads: number[][];
  coast: number[][];
  water: number[][];
  /** each building: [height, x0, z0, x1, z1, ...] */
  districts: Record<string, { b: number[][]; p?: number[][] }>;
}

let promise: Promise<CityData | null> | null = null;
export function loadCity(): Promise<CityData | null> {
  promise ??= fetch('/geo/city.json')
    .then((r) => (r.ok ? (r.json() as Promise<CityData>) : null))
    .catch(() => null);
  return promise;
}

export function useCity(): CityData | null {
  const [city, setCity] = useState<CityData | null>(null);
  useEffect(() => {
    let live = true;
    loadCity().then((d) => live && setCity(d));
    return () => {
      live = false;
    };
  }, []);
  return city;
}
