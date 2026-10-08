import { useEffect, useId, useRef, useState } from "react";
import { artUrl } from "../artAssets";
import { FrameClock } from "../visuals/frameClock";

export function PlayerPortrait({
  gender = "male",
  full = false,
  className = "",
}: {
  gender?: "male" | "female";
  full?: boolean;
  className?: string;
}) {
  const filterId = useId();
  const pauseRef = useRef(false);
  const control = useRef<() => void>(() => {});
  const canvas = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    pauseRef.current = paused;
    control.current();
  }, [paused]);
  const src = artUrl(`art/player/${gender}.png`);
  useEffect(() => {
    if (!full || !canvas.current) return;
    const node = canvas.current;
    const gl = node.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) return;
    setReady(false);
    let disposed = false,
      frame = 0,
      visible = true,
      loaded = false;
    const clock = new FrameClock();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const shaders: WebGLShader[] = [];
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      shaders.push(s);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(
      program,
      shader(
        gl.VERTEX_SHADER,
        `attribute vec2 p; varying vec2 uv; void main(){ uv=vec2((p.x+1.)*.5,(1.-p.y)*.5); gl_Position=vec4(p,0.,1.); }`,
      ),
    );
    gl.attachShader(
      program,
      shader(
        gl.FRAGMENT_SHADER,
        `precision mediump float;
      varying vec2 uv; uniform sampler2D art; uniform float t; uniform float eyeY;
      void main(){ vec2 q=uv; float side=smoothstep(.09,.23,abs(q.x-.5));
      float hair=(1.-smoothstep(.26,.39,q.y))*smoothstep(.05,.12,q.y)*side;
      float cloth=smoothstep(.27,.6,q.y)*(1.-smoothstep(.86,.98,q.y));
      float wind=sin(t*1.3-q.y*7.)*.55+sin(t*2.1+q.y*13.)*.25;
      q.x-=wind*(hair*.008+cloth*side*.011);
      float chest=exp(-pow(abs((q.y-.34)/.17),2.));
      q.x=.5+(q.x-.5)*(1.-sin(t*1.5)*.0035*chest);
      q.y+=sin(t*1.5)*.0012*chest;
      float blink=pow(max(0.,sin(t*1.07)),90.);
      float eyes=max(exp(-pow(abs((q.x-.467)/.015),4.)),exp(-pow(abs((q.x-.518)/.015),4.)));
      float eyelid=eyes*exp(-pow(abs((q.y-eyeY)/.0045),4.));
      q.y+=(q.y-eyeY)*blink*5.*eyelid;
      vec4 c=texture2D(art,q); c.a=smoothstep(.35,.92,c.a); gl_FragColor=c; }`,
      ),
    );
    gl.linkProgram(program);
    const buffer = gl.createBuffer()!,
      texture = gl.createTexture()!;
    const dispose = () => {
      disposed = true;
      cancelAnimationFrame(frame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach((s) => gl.deleteShader(s));
    };
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      dispose();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const time = gl.getUniformLocation(program, "t");
    gl.uniform1f(
      gl.getUniformLocation(program, "eyeY"),
      gender === "female" ? 0.0985 : 0.085,
    );
    const blocked = () =>
      pauseRef.current ||
      document.hidden ||
      reduce.matches ||
      !visible ||
      !!document.querySelector('dialog[open], [role="dialog"]');
    const draw = () => {
      gl.uniform1f(time, clock.elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const tick = (now: number) => {
      if (disposed || !loaded || blocked()) {
        frame = 0;
        return;
      }
      if (clock.advance(now)) draw();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      clock.reset();
      if (loaded && !blocked()) frame = requestAnimationFrame(tick);
    };
    control.current = sync;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(node);
    const modalObserver = new MutationObserver(sync);
    modalObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    const img = new Image();
    img.onload = () => {
      if (disposed) return;
      node.width = 640;
      node.height = Math.round((640 * img.height) / img.width);
      gl.viewport(0, 0, node.width, node.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      loaded = true;
      draw();
      setReady(true);
      sync();
    };
    const lost = (e: Event) => {
      e.preventDefault();
      setReady(false);
      cancelAnimationFrame(frame);
      loaded = false;
    };
    node.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);
    img.src = src;
    return () => {
      control.current = () => {};
      img.onload = null;
      observer.disconnect();
      modalObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduce.removeEventListener("change", sync);
      node.removeEventListener("webglcontextlost", lost);
      dispose();
    };
  }, [src, full, gender]);
  return (
    <div
      className={`player-art ${full ? "full-figure" : "face-figure"} ${className}`}
    >
      <svg
        className="player-static"
        viewBox={full ? "0 0 1024 1536" : "350 40 320 340"}
        preserveAspectRatio={full ? "xMidYMid meet" : "xMidYMid slice"}
        aria-hidden={full && ready}
        role="img"
        aria-label={`${gender === "female" ? "女侠" : "少侠"}正面画像`}
        style={{ visibility: full && ready ? "hidden" : "visible" }}
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncA
                type="table"
                tableValues="0 0 0 0 .02 .12 .32 .60 .85 1 1"
              />
            </feComponentTransfer>
          </filter>
        </defs>
        <image
          href={src}
          width="1024"
          height="1536"
          filter={`url(#${filterId})`}
        />
      </svg>
      {full && (
        <>
          <canvas
            ref={canvas}
            role="img"
            aria-label={`${gender === "female" ? "女侠" : "少侠"}动态立绘`}
            aria-hidden={!ready}
            style={{ opacity: ready ? 1 : 0 }}
          />
          <button
            type="button"
            className="portrait-motion"
            aria-pressed={paused}
            onClick={() => setPaused((x) => !x)}
          >
            {paused ? "播放立绘" : "暂停立绘"}
          </button>
        </>
      )}
    </div>
  );
}
