import { canvasSize, coverPainting } from "./landscapeMath";
import { FrameClock } from "./frameClock";

const vertex = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * .5 + .5;
  uv.y = 1. - uv.y;
  gl_Position = vec4(position, 0., 1.);
}`;

const fragment = `
precision highp float;
varying vec2 uv;
uniform sampler2D landscape;
uniform sampler2D swordsman;
uniform vec3 view;
uniform vec2 footprint;
uniform float time;

float band(float a, float b, float c, float d, float v) {
  return smoothstep(a,b,v) * (1.-smoothstep(c,d,v));
}
float ellipse(vec2 p, vec2 center, vec2 radius) {
  return 1.-smoothstep(.45,1.,length((p-center)/radius));
}
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float cloud(vec2 p) {
  return .57*noise(p)+.28*noise(p*2.03+4.7)+.15*noise(p*4.1-3.2);
}

float wind(float lag) {
  float t=time-lag;
  return .52+.27*sin(t*.47)+.16*sin(t*.83+.6);
}

// Roots are fixed; only the canopy bends. Each stand has a different gust phase.
vec2 tree(vec2 p, vec2 root, vec2 radius, float phase) {
  vec2 center=root-vec2(0.,radius.y*.6);
  float weight=ellipse(p,center,radius)*clamp((root.y-p.y)/radius.y,0.,1.);
  float t=time-phase*.24;
  float branch=sin(t*1.25+phase*.35);
  // Small leaf clusters trail their branch, with most flutter at the tips.
  float tips=weight*weight;
  float leaves=sin(t*3.4+p.x*.041+p.y*.025)*tips;
  return (vec2(7.5*branch,1.9*sin(t*1.25+.7))*weight
          +vec2(1.5*leaves,.7*leaves))*wind(phase*.24);
}

vec2 fabric(vec2 p) {
  // The diagonal cape lies over the heavier skirt. Their weights overlap softly,
  // but the inner layer receives less movement where the outer fabric covers it.
  float loose=1.-smoothstep(140.,332.,p.x);
  float cape=band(645.,679.,800.,835.,p.y+.32*(p.x-180.))*loose;
  float hem=band(790.,849.,995.,1030.,p.y)
            *(1.-smoothstep(195.,350.,p.x))*(1.-cape*.75);
  float hair=band(589.,611.,652.,674.,p.y)*(1.-smoothstep(195.,280.,p.x));
  float travel=clamp((330.-p.x)*.004,0.,1.2);
  float t=time-travel;
  float wave=sin(t*1.65)+.13*sin(t*3.3+.8);
  float edge=loose*loose;
  // A travelling gust lifts the loose edge first. The heavy hem settles later.
  vec2 outer=vec2(22.*wave,24.*sin(t*1.65+.55))
             +vec2(2.4,2.)*sin(t*3.7-p.y*.014)*edge;
  vec2 inner=vec2(15.*sin((t-.48)*1.45),18.*sin((t-.48)*1.45+.45));
  vec2 strands=vec2(9.*sin((t+.18)*2.3),10.*sin((t+.18)*2.3+.4));
  return outer*cape*wind(travel)+inner*hem*wind(travel+.48)
         +strands*hair*wind(travel-.18);
}

vec4 characterSample(vec2 coord) {
  vec4 ink=texture2D(swordsman,clamp(coord,0.,1.));
  float inside=step(0.,coord.x)*step(coord.x,1.)*step(0.,coord.y)*step(coord.y,1.);
  ink.a=smoothstep(.68,.96,ink.a)*inside;
  // Filter premultiplied ink so transparent extraction haze cannot darken edges.
  return vec4(ink.rgb*ink.a,ink.a);
}

void main() {
  vec2 p=vec2(view.z+uv.x*view.x,uv.y*view.y);
  vec2 shift=tree(p,vec2(22.,961.),vec2(95.,207.),.1)
            +tree(p,vec2(171.,1032.),vec2(104.,117.),.6)
            +tree(p,vec2(419.,1105.),vec2(48.,76.),1.1)
            +tree(p,vec2(987.,559.),vec2(98.,142.),1.5)
            +tree(p,vec2(982.,340.),vec2(68.,92.),2.1)
            +tree(p,vec2(676.,617.),vec2(54.,72.),3.4)
            +tree(p,vec2(552.,1246.),vec2(108.,126.),.8);
  vec3 color=texture2D(landscape,(p-shift)/vec2(1024.,1536.)).rgb;

  // Windows use the warm ink already in the painting, each bay on its own phase.
  float tower=band(693.,718.,817.,847.,p.x)*band(210.,225.,350.,371.,p.y);
  float distantTower=ellipse(p,vec2(593.,445.),vec2(38.,35.));
  float warmInk=smoothstep(.045,.14,color.r-color.b)*smoothstep(.43,.8,color.r);
  float windowPhase=hash(floor(p/vec2(13.,19.)))*6.283;
  float candle=.07*sin(time*.67+windowPhase)+.015*sin(time*1.83+windowPhase*1.7);
  color+=color*warmInk*max(tower,distantTower)*candle;

  // Flowing density fields roll through valleys. Dark foreground ridges occlude
  // most of the mist, rather than receiving an even white veil across the picture.
  float valley=max(ellipse(p,vec2(395.,552.),vec2(415.,144.)),
                   ellipse(p,vec2(662.,783.),vec2(368.,237.)));
  valley=max(valley,ellipse(p,vec2(826.,1165.),vec2(279.,327.)));
  float flow=time+.5*sin(time*.47);
  float far=cloud(p/vec2(145.,57.)+vec2(flow*.105,-flow*.025));
  float near=cloud(p/vec2(228.,81.)+vec2(flow*.20,-flow*.046)+vec2(far*.85,far*.34));
  float ridge=cloud(p/vec2(160.,43.)+vec2(flow*.16,-flow*.035)+vec2(near*.6,far*.4));
  float terrain=.24+.76*smoothstep(.2,.68,dot(color,vec3(.25,.6,.15)));
  float density=smoothstep(.32,.7,near)*.45+smoothstep(.43,.73,ridge)*.17;
  vec3 mist=mix(vec3(.77,.815,.80),vec3(.93,.935,.89),smoothstep(.3,.66,far));
  color=mix(color,mist,density*valley*terrain);

  // Low ribbons pass in front of the lower storeys; the roof silhouette remains
  // anchored. Light diffuses only around the original lit windows, never the moon.
  float towerVeil=ellipse(p,vec2(772.,329.),vec2(155.,65.))
                  +ellipse(p,vec2(589.,461.),vec2(78.,44.))*.72;
  float ribbon=cloud(p/vec2(156.,29.)+vec2(flow*.13,-flow*.04)+vec2(far*.4,near*.65));
  float fog=smoothstep(.30,.69,ribbon)*towerVeil*.50;
  color=mix(color,mix(vec3(.77,.81,.80),vec3(.91,.925,.89),far),fog);
  float halo=exp(-dot((p-vec2(773.,323.))/vec2(17.,12.),(p-vec2(773.,323.))/vec2(17.,12.)))
             +.42*exp(-dot((p-vec2(749.,273.))/vec2(12.,8.),(p-vec2(749.,273.))/vec2(12.,8.)))
             +.30*exp(-dot((p-vec2(592.,451.))/vec2(10.,7.),(p-vec2(592.,451.))/vec2(10.,7.)));
  color+=vec3(1.,.70,.35)*halo*(.012+fog*.14)*(1.+candle);

  // Inverse deformation of a real alpha cutout exposes the restored background, not stretched scenery.
  vec2 source=p;
  source=p-fabric(source);
  source=p-fabric(source);
  source=p-fabric(source);
  source=p-fabric(source);
  vec2 characterUV=(source-vec2(48.,260.))/(.59*vec2(1024.,1536.));
  // Four subpixel taps soften moving torn edges without erasing fine ink strands.
  vec2 tap=footprint/(.59*vec2(1024.,1536.))*.28;
  vec4 person=(characterSample(characterUV+tap)+characterSample(characterUV-tap)
              +characterSample(characterUV+vec2(tap.x,-tap.y))
              +characterSample(characterUV+vec2(-tap.x,tap.y)))*.25;
  color=color*(1.-person.a)+person.rgb;
  gl_FragColor=vec4(color,1.);
}`;

export type LandscapePlayer = {
  setPlaying: (playing: boolean) => void;
  dispose: () => void;
};

export function createLandscape(
  canvas: HTMLCanvasElement,
  background: HTMLImageElement,
  character: HTMLImageElement,
): LandscapePlayer {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("WebGL unavailable");
  const shaders: WebGLShader[] = [];
  const textures: WebGLTexture[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let observer: ResizeObserver | undefined;
  let frame = 0;
  let playing = false;
  let disposed = false;
  const clock = new FrameClock();
  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    textures.forEach((texture) => gl.deleteTexture(texture));
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
  try {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Cannot allocate shader");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(
          gl.getShaderInfoLog(shader) || "Shader compilation failed",
        );
      return shader;
    };
    program = gl.createProgram();
    if (!program) throw new Error("Cannot allocate landscape program");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    [background, character].forEach((image, index) => {
      const texture = gl.createTexture();
      if (!texture) throw new Error("Cannot allocate landscape texture");
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.uniform1i(
        gl.getUniformLocation(program!, index ? "swordsman" : "landscape"),
        index,
      );
    });
    const viewUniform = gl.getUniformLocation(program, "view");
    const footprintUniform = gl.getUniformLocation(program, "footprint");
    const timeUniform = gl.getUniformLocation(program, "time");
    const draw = () => {
      if (disposed || gl.isContextLost()) return;
      gl.uniform1f(timeUniform, clock.elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height || disposed) return;
      const size = canvasSize(width, height, window.devicePixelRatio || 1);
      canvas.width = size.width;
      canvas.height = size.height;
      gl.viewport(0, 0, size.width, size.height);
      const view = coverPainting(width, height);
      gl.uniform3f(viewUniform, view.width, view.height, view.left);
      gl.uniform2f(
        footprintUniform,
        view.width / size.width,
        view.height / size.height,
      );
      draw();
    };
    const tick = (now: number) => {
      if (!playing || disposed) return;
      if (clock.advance(now)) draw();
      frame = requestAnimationFrame(tick);
    };
    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (gl.getError() !== gl.NO_ERROR)
      throw new Error("Landscape texture or draw failed");
    return {
      setPlaying(value) {
        if (disposed || playing === value) return;
        playing = value;
        clock.reset();
        cancelAnimationFrame(frame);
        if (playing) frame = requestAnimationFrame(tick);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
