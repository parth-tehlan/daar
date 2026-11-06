import { LineBasicMaterial, Vector2, Vector3 } from 'three';
import type { LineBasicMaterialParameters } from 'three';

/** Shared uniforms for the radial "spot-light" fade on lines. */
export interface Fade {
  uFocus: { value: Vector2 };
  uRadius: { value: number };
  /** screen-space mask: x fraction from/to, floor */
  uMaskFrom: { value: number };
  uMaskTo: { value: number };
  uMaskFloor: { value: number };
  uViewportW: { value: number };
  uViewportH: { value: number };
  uBotFloor: { value: number };
  /** building-line opacity multiplier by camera distance */
  uLod: { value: number };
  /** x, z, radius of the quiet clearing around the project tower (radius 0 = off) */
  uClear: { value: Vector3 };
}

export const NO_FADE_RADIUS = 400000;

export function createFade(): Fade {
  return {
    uFocus: { value: new Vector2() },
    uRadius: { value: NO_FADE_RADIUS },
    uMaskFrom: { value: 0.4 },
    uMaskTo: { value: 0.62 },
    uMaskFloor: { value: 1 },
    uViewportW: { value: 1600 },
    uViewportH: { value: 1000 },
    uBotFloor: { value: 1 },
    uLod: { value: 1 },
    uClear: { value: new Vector3(0, 0, 0) },
  };
}

/** LineBasicMaterial whose alpha falls off with xz distance from the fade focus. */
export function fadeLineMaterial(fade: Fade, params: LineBasicMaterialParameters, radiusMul = 1, floor = 0.1, buildings = false): LineBasicMaterial {
  const m = new LineBasicMaterial({ transparent: true, depthWrite: false, fog: true, ...params });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFocus = fade.uFocus;
    sh.uniforms.uRadius = fade.uRadius;
    for (const k of ['uMaskFrom', 'uMaskTo', 'uMaskFloor', 'uViewportW', 'uViewportH', 'uBotFloor', 'uLod', 'uClear'] as const) sh.uniforms[k] = fade[k];
    sh.uniforms.uBld = { value: buildings ? 1 : 0 };
    sh.uniforms.uRadMul = { value: radiusMul };
    sh.uniforms.uFloor = { value: floor };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWxz;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWxz = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWxz;\nuniform vec2 uFocus;\nuniform float uRadius;\nuniform float uRadMul;\nuniform float uFloor;\nuniform float uMaskFrom;\nuniform float uMaskTo;\nuniform float uMaskFloor;\nuniform float uViewportW;\nuniform float uViewportH;\nuniform float uBotFloor;\nuniform float uLod;\nuniform vec3 uClear;\nuniform float uBld;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n{ float r = uRadius * uRadMul; float fd = distance(vWxz, uFocus); diffuseColor.a *= mix(uFloor, 1.0, 1.0 - smoothstep(r * 0.25, r, fd));\n  diffuseColor.a *= mix(uMaskFloor, 1.0, smoothstep(uMaskFrom, uMaskTo, gl_FragCoord.x / uViewportW));\n  diffuseColor.a *= mix(uBotFloor, 1.0, smoothstep(0.10, 0.20, gl_FragCoord.y / uViewportH));\n  if (uBld > 0.5) { diffuseColor.a *= uLod; if (uClear.z > 0.0) diffuseColor.a *= mix(0.3, 1.0, smoothstep(uClear.z, uClear.z * 1.78, distance(vWxz, uClear.xy))); } }',
      );
  };
  m.customProgramCacheKey = () => `fade${radiusMul}${buildings}`;
  return m;
}
