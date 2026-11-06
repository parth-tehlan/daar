import { LineBasicMaterial, Vector2 } from 'three';
import type { LineBasicMaterialParameters } from 'three';

/** Shared uniforms for the radial "spot-light" fade on lines. */
export interface Fade {
  uFocus: { value: Vector2 };
  uRadius: { value: number };
}

export const NO_FADE_RADIUS = 400000;

export function createFade(): Fade {
  return { uFocus: { value: new Vector2() }, uRadius: { value: NO_FADE_RADIUS } };
}

/** LineBasicMaterial whose alpha falls off with xz distance from the fade focus. */
export function fadeLineMaterial(fade: Fade, params: LineBasicMaterialParameters, radiusMul = 1, floor = 0.1): LineBasicMaterial {
  const m = new LineBasicMaterial({ transparent: true, depthWrite: false, fog: true, ...params });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFocus = fade.uFocus;
    sh.uniforms.uRadius = fade.uRadius;
    sh.uniforms.uRadMul = { value: radiusMul };
    sh.uniforms.uFloor = { value: floor };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWxz;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWxz = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWxz;\nuniform vec2 uFocus;\nuniform float uRadius;\nuniform float uRadMul;\nuniform float uFloor;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n{ float r = uRadius * uRadMul; float fd = distance(vWxz, uFocus); diffuseColor.a *= mix(uFloor, 1.0, 1.0 - smoothstep(r * 0.25, r, fd)); }',
      );
  };
  m.customProgramCacheKey = () => `fade${radiusMul}`;
  return m;
}
