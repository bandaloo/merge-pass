import { CodeBuilder } from "./codebuilder";
import { WebGLProgramLoop } from "./webglprogramloop";
import { Needs, ExprVec4, Expr } from "./expressions/expr";

export interface LoopInfo {
  num: number;
  func?: (arg0: number) => void;
}

export interface EffectLike {
  getSampleNum(mult: number): number;
  getNeeds(name: keyof Needs): boolean;
}

export interface Generable {
  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs,
    sceneSource: TexImageSource
  ): WebGLProgramLoop;
}

// TODO get rid of this
export function getNeedsOfList(name: keyof Needs, list: (EffectLoop | Expr)[]) {
  if (list.length === 0) {
    throw new Error("list was empty, so no needs could be found");
  }
  const bools: boolean[] = list.map((e) => e.getNeeds(name)) as boolean[];
  return bools.reduce((acc: boolean, curr: boolean) => acc || curr);
}

export class EffectLoop implements EffectLike, Generable {
  effects: EffectElement[];
  repeat: LoopInfo;

  constructor(effects: EffectElement[], repeat: LoopInfo) {
    this.effects = effects;
    this.repeat = repeat;
  }

  getNeeds(name: keyof Needs) {
    return getNeedsOfList(name, this.effects);
    //const bools: boolean[] = this.effects.map((e) => e.getNeeds(name));
    //return bools.reduce((acc: boolean, curr: boolean) => acc || curr);
  }

  getSampleNum(mult = 1) {
    mult *= this.repeat.num;
    let acc = 0;
    for (const e of this.effects) {
      acc += e.getSampleNum(mult);
    }
    return acc;
  }

  /** places effects into loops broken up by sampling effects */
  regroup() {
    let sampleCount = 0;
    /** number of samples in all previous */
    let prevSampleCount = 0;
    let prevEffects: EffectElement[] = [];
    const regroupedEffects: EffectElement[] = [];
    const breakOff = () => {
      if (prevEffects.length > 0) {
        // break off all previous effects into their own loop
        if (prevEffects.length === 1) {
          // this is to prevent wrapping in another effect loop
          regroupedEffects.push(prevEffects[0]);
        } else {
          regroupedEffects.push(new EffectLoop(prevEffects, { num: 1 }));
        }
        sampleCount -= prevSampleCount;
        prevEffects = [];
      }
    };
    for (const e of this.effects) {
      const sampleNum = e.getSampleNum();
      prevSampleCount = sampleCount;
      sampleCount += sampleNum;
      if (sampleCount > 0) breakOff();
      prevEffects.push(e);
    }
    // push on all the straggling effects after the grouping is done
    breakOff();
    return regroupedEffects;
  }

  /** recursive descent parser for turning effects into programs */
  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs
  ): WebGLProgramLoop {
    // TODO we probably don't need scenesource anymore
    if (this.getSampleNum() / this.repeat.num <= 1) {
      // if this group only samples neighbors at most once, create program
      const codeBuilder = new CodeBuilder(this);
      const program = codeBuilder.compileProgram(gl, vShader, uniformLocs);
      return program;
    }
    // otherwise, regroup and try again on regrouped loops
    this.effects = this.regroup();
    // okay to have undefined needs here
    return new WebGLProgramLoop(
      this.effects.map((e) => e.genPrograms(gl, vShader, uniformLocs)),
      this.repeat,
      gl
    );
  }
}

export function loop(effects: EffectElement[], rep: number) {
  return new EffectLoop(effects, { num: rep });
}

type EffectElement = ExprVec4 | EffectLoop;

// TODO we don't really want to export this at the package level
export interface UniformLocs {
  [name: string]: WebGLUniformLocation;
}

const V_SOURCE = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}\n`;

type FilterMode = "linear" | "nearest";
type ClampMode = "clamp" | "wrap";

interface MergerOptions {
  minFilterMode?: FilterMode;
  maxFilterMode?: FilterMode;
  edgeMode?: ClampMode;
}

export interface TexInfo {
  front: WebGLTexture;
  back: WebGLTexture;
  scene: WebGLTexture | undefined;
}

export class Merger {
  /** the context to render to */
  gl: WebGL2RenderingContext;
  /** the context to apply post-processing to */
  private source: TexImageSource;
  private tex: TexInfo;
  private framebuffer: WebGLFramebuffer;
  private uniformLocs: UniformLocs = {};
  private effectLoop: EffectLoop;
  private programLoop: WebGLProgramLoop;

  private options: MergerOptions | undefined;

  constructor(
    effects: (ExprVec4 | EffectLoop)[] | EffectLoop,
    source: TexImageSource,
    gl: WebGL2RenderingContext,
    options?: MergerOptions
  ) {
    // wrap the given list of effects as a loop if need be
    if (!(effects instanceof EffectLoop)) {
      this.effectLoop = new EffectLoop(effects, { num: 1 });
    } else {
      this.effectLoop = effects;
    }
    if (this.effectLoop.effects.length === 0) {
      throw new Error("list of effects was empty");
    }
    this.source = source;
    this.gl = gl;
    this.options = options;

    // set the viewport
    this.gl.viewport(
      0,
      0,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight
    );

    // set up the vertex buffer
    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    const vertexArray = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    const triangles = new Float32Array(vertexArray);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, triangles, this.gl.STATIC_DRAW);

    // compile the simple vertex shader (2 big triangles)
    const vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (vShader === null) {
      throw new Error("problem creating the vertex shader");
    }

    this.gl.shaderSource(vShader, V_SOURCE);
    this.gl.compileShader(vShader);

    // make textures
    this.tex = {
      front: makeTexture(this.gl, this.options),
      back: makeTexture(this.gl, this.options),
      scene: undefined,
    };

    // create the framebuffer
    const framebuffer = gl.createFramebuffer();
    if (framebuffer === null) {
      throw new Error("problem creating the framebuffer");
    }
    this.framebuffer = framebuffer;

    // generate the fragment shaders and programs
    this.programLoop = this.effectLoop.genPrograms(
      this.gl,
      vShader,
      this.uniformLocs
    );

    // find the final program
    let atBottom = false;

    let currProgramLoop = this.programLoop;
    while (!atBottom) {
      if (currProgramLoop.programElement instanceof WebGLProgram) {
        // we traveled right and hit a program, so it must be the last
        currProgramLoop.last = true;
        atBottom = true;
      } else {
        // set the current program loop to the last in the list
        currProgramLoop =
          currProgramLoop.programElement[
            currProgramLoop.programElement.length - 1
          ];
      }
    }
    if (this.programLoop.getTotalNeeds().sceneBuffer) {
      this.tex.scene = makeTexture(this.gl, this.options);
    }
    // TODO get rid of this (or make it only log when verbose)
    console.log(this.programLoop);
  }

  draw(time: number = 0) {
    //this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex.back);
    sendTexture(this.gl, this.source);

    if (
      this.programLoop.getTotalNeeds().sceneBuffer &&
      this.tex.scene !== undefined
    ) {
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex.scene);
      sendTexture(this.gl, this.source);
    }
    // swap textures before beginning draw
    this.programLoop.draw(
      this.gl,
      this.tex,
      this.framebuffer,
      this.uniformLocs,
      this.programLoop.last,
      time
    );
  }
}

export function makeTexture(
  gl: WebGL2RenderingContext,
  options?: MergerOptions
) {
  const texture = gl.createTexture();
  if (texture === null) {
    throw new Error("problem creating texture");
  }

  // flip the order of the pixels, or else it displays upside down
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // bind the texture after creating it
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );

  const filterMode = (f: undefined | FilterMode) =>
    f === undefined || f === "linear" ? gl.LINEAR : gl.NEAREST;

  // how to map texture element
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    filterMode(options?.minFilterMode)
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    filterMode(options?.maxFilterMode)
  );

  if (options?.edgeMode !== "wrap") {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  return texture;
}

export function sendTexture(gl: WebGL2RenderingContext, src: TexImageSource) {
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
}
