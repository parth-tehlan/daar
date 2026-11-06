import { useEffect, useMemo } from 'react';
import { DoubleSide, LineBasicMaterial, MeshBasicMaterial } from 'three';
import { buildBuildings, buildPolylines } from './buildCity';
import type { HideRect } from './buildCity';
import type { CityData } from './geo';
import type { Palette } from './theme';
import type { DistrictId, SceneMode } from '../types';

const noRaycast = () => null;
const LINE_OPACITY = 0.6;

interface Props {
  city: CityData;
  palette: Palette;
  mode: SceneMode;
  focus: DistrictId[];
  hide: HideRect | null;
  hideDistrict: string | null;
}

function District({ id, list, palette, opacity, fillMat, hide }: {
  id: string; list: number[][]; palette: Palette; opacity: number; fillMat: MeshBasicMaterial; hide: HideRect | null;
}) {
  const geo = useMemo(() => buildBuildings(list, hide), [list, hide]);
  const lineMat = useMemo(
    () => new LineBasicMaterial({ color: palette.line, transparent: true, opacity, fog: true, depthWrite: false }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => { lineMat.color.set(palette.line); }, [lineMat, palette.line]);
  useEffect(() => { lineMat.opacity = opacity; }, [lineMat, opacity]);
  useEffect(() => () => { geo.fill.dispose(); geo.lines.dispose(); }, [geo]);
  useEffect(() => () => lineMat.dispose(), [lineMat]);
  return (
    <group name={id}>
      <mesh geometry={geo.fill} material={fillMat} raycast={noRaycast} renderOrder={1} />
      <lineSegments geometry={geo.lines} material={lineMat} raycast={noRaycast} renderOrder={2} />
    </group>
  );
}

export function CityLayers({ city, palette, mode, focus, hide, hideDistrict }: Props) {
  const fillMat = useMemo(
    () => new MeshBasicMaterial({
      color: palette.ink, side: DoubleSide, fog: true,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const roadMat = useMemo(() => new LineBasicMaterial({ color: palette.line, transparent: true, opacity: 0.22, fog: true, depthWrite: false }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const edgeMat = useMemo(() => new LineBasicMaterial({ color: palette.line, transparent: true, opacity: 0.55, fog: true, depthWrite: false }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const geos = useMemo(
    () => ({ roads: buildPolylines(city.roads, 0.5), coast: buildPolylines(city.coast, 0.5), water: buildPolylines(city.water, 0.5) }),
    [city],
  );
  const k = mode === 'onboarding' ? 0.7 : 1;
  useEffect(() => {
    fillMat.color.set(palette.ink);
    roadMat.color.set(palette.line);
    edgeMat.color.set(palette.line);
  }, [palette, fillMat, roadMat, edgeMat]);
  useEffect(() => { roadMat.opacity = 0.22 * k; edgeMat.opacity = 0.55 * k; }, [k, roadMat, edgeMat]);
  useEffect(() => () => { fillMat.dispose(); roadMat.dispose(); edgeMat.dispose(); }, [fillMat, roadMat, edgeMat]);
  useEffect(() => () => { geos.roads.dispose(); geos.coast.dispose(); geos.water.dispose(); }, [geos]);

  const dimming = mode === 'onboarding' && focus.length > 0;
  return (
    <>
      <lineSegments geometry={geos.roads} material={roadMat} raycast={noRaycast} />
      <lineSegments geometry={geos.coast} material={edgeMat} raycast={noRaycast} />
      <lineSegments geometry={geos.water} material={edgeMat} raycast={noRaycast} />
      {Object.entries(city.districts).map(([id, d]) => (
        <District
          key={id}
          id={id}
          list={d.b}
          palette={palette}
          fillMat={fillMat}
          hide={hideDistrict === id ? hide : null}
          opacity={LINE_OPACITY * k * (dimming && !focus.includes(id as DistrictId) ? 0.4 / 0.7 : 1)}
        />
      ))}
    </>
  );
}
