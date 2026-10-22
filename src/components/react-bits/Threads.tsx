"use client";

// React Bits Threads, adapted from d50d8117. See README.md and LICENSE.react-bits-2025.md.
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;

#define PI 3.1415926538

const int u_line_count = 20;
const float u_line_width = 3.0;
const float u_line_blur = 5.0;

float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
    float split_offset = (perc * 0.4);
    float split_point = 0.1 + split_offset;

    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength
                           * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);

    float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );

    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

    float line_start = smoothstep(
        y + (width / 2.0) + (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        y,
        st.y
    );

    float line_end = smoothstep(
        y,
        y - (width / 2.0) - (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        st.y
    );

    return clamp(
        (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
        0.0,
        1.0
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;
    fragColor = vec4(uColor * colorVal, colorVal);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

export function Threads({ paused = false }: { paused?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current?.();
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: true, dpr: 1, antialias: false });
    } catch {
      return;
    }
    const gl = renderer.gl;
    if (!gl || !gl.getParameter(gl.VERSION)) return;
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const software =
      debug &&
      /swiftshader|llvmpipe|software/i.test(
        String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)),
      );
    const frameInterval = software ? 100 : 33;
    const resolutionScale = software ? 0.45 : 0.8;
    gl.clearColor(0, 0, 0, 0);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      transparent: true,
      uniforms: {
        iTime: { value: 8 },
        iResolution: { value: new Float32Array([1, 1, 1]) },
        uColor: { value: new Float32Array([1, 1, 1]) },
        uAmplitude: { value: 1.8 },
        uDistance: { value: 0.24 },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const canvas = gl.canvas as HTMLCanvasElement;
    container.appendChild(canvas);
    container.dataset.ready = "true";
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;
    let elapsed = 8;
    let visible = true;
    let lost = false;
    let targetX = 0.5;
    let targetY = 0.5;
    const draw = () => renderer.render({ scene: mesh });
    const update = (now: number) => {
      frame = 0;
      if (now - last >= frameInterval) {
        elapsed += Math.min((now - last) / 1000, 0.12) * 0.65;
        last = now;
        program.uniforms.iTime.value = elapsed;
        const mouse = program.uniforms.uMouse.value;
        mouse[0] += (targetX - mouse[0]) * 0.06;
        mouse[1] += (targetY - mouse[1]) * 0.06;
        draw();
      }
      frame = requestAnimationFrame(update);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      const running =
        !lost &&
        visible &&
        !pausedRef.current &&
        !media.matches &&
        !document.hidden;
      container.dataset.running = String(running);
      if (running) {
        last = performance.now();
        frame = requestAnimationFrame(update);
      }
    };
    syncRef.current = sync;
    const resize = () => {
      const width = Math.max(
        1,
        Math.min(720, Math.round(container.clientWidth * resolutionScale)),
      );
      const height = Math.max(
        1,
        Math.min(420, Math.round(container.clientHeight * resolutionScale)),
      );
      renderer.setSize(width, height);
      program.uniforms.iResolution.value.set([width, height, width / height]);
      if (!lost) draw();
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || pausedRef.current || media.matches)
        return;
      const rect = container.getBoundingClientRect();
      targetX = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width),
      );
      targetY =
        1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      container.dataset.ready = "false";
      sync();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(container);
    container.parentElement?.addEventListener("pointermove", pointer);
    canvas.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    resize();
    sync();
    return () => {
      syncRef.current = null;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      container.parentElement?.removeEventListener("pointermove", pointer);
      canvas.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
      geometry.remove();
      gl.deleteProgram(program.program);
      canvas.remove();
      delete container.dataset.ready;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div ref={containerRef} className="threads-container" aria-hidden="true">
      <svg className="threads-fallback" viewBox="0 0 800 400" fill="none">
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M-80 ${130 + i * 8} C200 ${100 + i * 4}, 350 ${450 - i * 15}, 880 ${60 + i * 9}`}
            stroke="currentColor"
            strokeOpacity=".15"
          />
        ))}
      </svg>
    </div>
  );
}
