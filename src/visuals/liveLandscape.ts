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

float wind(float phase) {
  return .72+.18*sin(time*.47+phase)+.1*sin(time*.83+.6+phase);
}

// Roots are fixed; only the canopy bends. Each stand has a different gust phase.
vec2 tree(vec2 p, vec2 root, vec2 radius, float phase) {
  vec2 center=root-vec2(0.,radius.y*.6);
  float weight=ellipse(p,center,radius)*clamp((root.y-p.y)/radius.y,0.,1.);
  float gust=sin(time*1.45+phase)+.18*sin(time*3.1+phase+p.y*.019);
  return vec2(8.*gust,2.1*sin(time*1.45+phase+.7))*weight*wind(phase*.2);
}

vec2 fabric(vec2 p) {
  // All weights fade to zero at the shoulders, hand, torso and boots.
  float loose=1.-smoothstep(170.,345.,p.x);
  float cape=band(627.,673.,804.,843.,p.y)*loose;
  float hem=band(798.,862.,1009.,1038.,p.y)*(1.-smoothstep(235.,354.,p.x));
  float hair=band(589.,610.,657.,675.,p.y)*(1.-smoothstep(203.,281.,p.x));
  // One travelling gust drives the silhouette; a smaller wave trails through the loose edge.
  // The low spatial frequency keeps the inverse mapping smooth rather than folding the cloth.
  float wave=sin(time*1.85+p.x*.010-p.y*.003);
  float ripple=sin(time*3.65+p.x*.022-p.y*.009);
  vec2 motion=vec2(23.*wave+3.*ripple,26.*sin(time*1.85+p.x*.011+.6)+3.*ripple)*cape;
  motion+=vec2(18.*sin(time*1.85+p.x*.011-1.),21.*sin(time*1.85+p.x*.012-.6))*hem;
  motion+=vec2(10.*sin(time*2.65+p.x*.014),12.*sin(time*2.65+p.x*.016))*hair;
  return motion*wind(0.);
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

  // Flowing density fields roll through the valleys behind the figure, never through the cliff.
  float valley=max(ellipse(p,vec2(395.,552.),vec2(415.,144.)),
                   ellipse(p,vec2(662.,783.),vec2(368.,237.)));
  valley=max(valley,ellipse(p,vec2(826.,1165.),vec2(279.,327.)));
  float far=cloud(p/vec2(145.,57.)+vec2(time*.105,-time*.025));
  float near=cloud(p/vec2(228.,81.)+vec2(time*.20,-time*.046)+vec2(far*.85,far*.34));
  float ridge=cloud(p/vec2(160.,43.)+vec2(time*.16,-time*.035)+vec2(near*.6));
  float density=smoothstep(.32,.7,near)*.42+smoothstep(.43,.73,ridge)*.16;
  vec3 mist=mix(vec3(.77,.815,.80),vec3(.93,.935,.89),smoothstep(.3,.66,far));
  color=mix(color,mist,density*valley);

  // Inverse deformation of a real alpha cutout exposes the restored background, not stretched scenery.
  vec2 source=p;
  source=p-fabric(source);
  source=p-fabric(source);
  source=p-fabric(source);
  source=p-fabric(source);
  vec2 characterUV=(source-vec2(48.,260.))/(.59*vec2(1024.,1536.));
  vec4 person=texture2D(swordsman,clamp(characterUV,0.,1.));
  float inside=step(0.,characterUV.x)*step(characterUV.x,1.)*step(0.,characterUV.y)*step(characterUV.y,1.);
  // Discard residual low-alpha extraction haze; retain the opaque ink and antialiased edges.
  float alpha=smoothstep(.68,.96,person.a)*inside;
  color=mix(color,person.rgb,alpha);
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
