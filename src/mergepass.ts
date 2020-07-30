import { CodeBuilder } from "./codebuilder";
import { ExprVec4, Needs } from "./exprs/expr";
import { fcolor, FragColorExpr } from "./exprs/fragcolorexpr";
import { region } from "./exprs/regiondecorator";
import { input } from "./exprs/scenesampleexpr";
import { SetColorExpr } from "./exprs/setcolorexpr";
import { ternary } from "./exprs/ternaryexpr";
import { Float, Vec4 } from "./exprtypes";
import { settings } from "./settings";
import {
  updateNeeds,
  WebGLProgramLeaf,
  WebGLProgramLoop,
} from "./webglprogramloop";

/** repetitions and callback for loop */
export interface LoopInfo {
  /** amount of times to repeat the loop */
  num: number;
  /** the channel buffer to target */
  target?: number;
  /** optional callback for loop */
  func?: (arg0: number) => void;
}

/**
 * classes that implement this can return how many times they sample the
 * original scene
 */
export interface EffectLike {
  /**
   * gets the amount of times an effect will need to sample the original scene
   * @param mult multiplier of the loop
   */
  getSampleNum(mult: number): number;
}

/**
 * a class implementing this interface can be compiled into a
 * [[WebGLProgramLoop]] which can contain nested loops
 */
export interface Generable {
  /** recursively generate programs out of this effect and all nested effects */
  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs,
    shaders: WebGLShader[]
  ): WebGLProgramLoop;
}

interface ProgramMap {
  [name: string]: WebGLProgramLoop;
}

interface UnprocessedEffectMap {
  [name: string]: (Vec4 | EffectLoop)[];
}

function wrapInSetColors(effects: (Vec4 | EffectLoop)[]): EffectElement[] {
  return effects.map((e) =>
    e instanceof ExprVec4 || e instanceof EffectLoop ? e : new SetColorExpr(e)
  );
}

// should be function of loop?
function processEffectMap(eMap: UnprocessedEffectMap): EffectMap {
  const result: EffectMap = {};
  for (const name in eMap) {
    const val = eMap[name];
    result[name] = wrapInSetColors(val);
  }
  return result;
}

interface EffectMap {
  [name: string]: EffectElement[];
}

export class EffectDictionary {
  effectMap: EffectMap;

  constructor(effectMap: UnprocessedEffectMap) {
    this.effectMap = processEffectMap(effectMap);
  }

  toProgramMap(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs,
    fShaders: WebGLShader[]
  ) {
    const programMap: ProgramMap = {};
    let needs: Needs = {
      neighborSample: false,
      centerSample: false,
      sceneBuffer: false,
      timeUniform: false,
      mouseUniform: false,
      passCount: false,
      extraBuffers: new Set<number>(),
    };
    for (const name in this.effectMap) {
      const effects = this.effectMap[name];
      // wrap the given list of effects as a loop if need be
      const effectLoop = new EffectLoop(effects, { num: 1 });
      if (effectLoop.effects.length === 0) {
        throw new Error("list of effects was empty");
      }
      const programLoop = effectLoop.genPrograms(
        gl,
        vShader,
        uniformLocs,
        fShaders
      );
      // walk the tree to the final program
      let atBottom = false;
      let currProgramLoop = programLoop;
      while (!atBottom) {
        if (currProgramLoop.programElement instanceof WebGLProgramLeaf) {
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
      needs = updateNeeds(needs, programLoop.getTotalNeeds());
      programMap[name] = programLoop;
    }
    return { programMap, needs };
  }
}

/** effect loop, which can loop over other effects or effect loops */
export class EffectLoop implements EffectLike, Generable {
  effects: EffectElement[];
  loopInfo: LoopInfo;

  constructor(effects: (Vec4 | EffectLoop)[], loopInfo: LoopInfo) {
    this.effects = wrapInSetColors(effects);
    this.loopInfo = loopInfo;
  }

  /** @ignore */
  getSampleNum(mult = 1, sliceStart = 0, sliceEnd = this.effects.length) {
    mult *= this.loopInfo.num;
    let acc = 0;
    const sliced = this.effects.slice(sliceStart, sliceEnd);
    for (const e of sliced) {
      acc += e.getSampleNum(mult);
    }
    return acc;
  }

  /**
   * @ignore
   * places effects into loops broken up by sampling effects
   */
  regroup() {
    let sampleCount = 0;
    /** number of samples in all previous */
    let prevSampleCount = 0;
    let prevEffects: EffectElement[] = [];
    const regroupedEffects: EffectElement[] = [];
    let prevTarget: undefined | number;
    let currTarget: undefined | number;
    let mustBreakCounter = 0;
    const breakOff = () => {
      mustBreakCounter--;
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
      if (e instanceof EffectLoop) {
        currTarget = e.loopInfo.target;
        if (e.hasTargetSwitch()) {
          mustBreakCounter = 2;
        }
      } else {
        // if it's not a loop it's assumed the target is that of outer loop
        currTarget = this.loopInfo.target;
      }
      if (
        sampleCount > 0 ||
        currTarget !== prevTarget ||
        mustBreakCounter > 0
      ) {
        breakOff();
      }
      prevEffects.push(e);
      prevTarget = currTarget;
    }
    // push on all the straggling effects after the grouping is done
    breakOff();
    return regroupedEffects;
  }

  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs,
    shaders: WebGLShader[]
  ): WebGLProgramLoop {
    // validate
    const fullSampleNum = this.getSampleNum() / this.loopInfo.num;
    const firstSampleNum =
      this.getSampleNum(undefined, 0, 1) / this.loopInfo.num;
    const restSampleNum = this.getSampleNum(undefined, 1) / this.loopInfo.num;
    if (
      !this.hasTargetSwitch() &&
      (fullSampleNum === 0 || (firstSampleNum === 1 && restSampleNum === 0))
    ) {
      const codeBuilder = new CodeBuilder(this);
      const program = codeBuilder.compileProgram(
        gl,
        vShader,
        uniformLocs,
        shaders
      );
      return program;
    }
    // otherwise, regroup and try again on regrouped loops
    this.effects = this.regroup();
    return new WebGLProgramLoop(
      this.effects.map((e) => e.genPrograms(gl, vShader, uniformLocs, shaders)),
      this.loopInfo,
      gl
    );
  }

  /**
   * changes the render target of an effect loop (-1 targest the scene texture;
   * this is used internally)
   */
  target(num: number) {
    this.loopInfo.target = num;
    return this;
  }

  /** @ignore */
  hasTargetSwitch() {
    for (const e of this.effects) {
      if (e instanceof EffectLoop) {
        if (e.loopInfo.target !== this.loopInfo.target || e.hasTargetSwitch())
          return true;
      }
    }
    return false;
  }

  /** @ignore */
  regionWrap(
    space: Float[] | Float,
    failure: Vec4,
    finalPath = true,
    not: boolean
  ) {
    this.effects = this.effects.map((e, index) =>
      // loops that aren't all the way to the right can't terminate the count ternery
      // don't wrap fcolors in a ternery (it's redundant)
      e instanceof EffectLoop
        ? e.regionWrap(space, failure, index === this.effects.length - 1, not)
        : new SetColorExpr(
            region(
              space,
              e.brandExprWithRegion(space),
              index === this.effects.length - 1 && finalPath
                ? !(failure instanceof FragColorExpr)
                  ? ternary(null, failure, fcolor())
                  : failure
                : fcolor(),
              not
            )
          )
    );
    return this;
  }
}

/** creates an effect loop */
export function loop(effects: (Vec4 | EffectLoop)[], rep = 1) {
  return new EffectLoop(effects, { num: rep });
}

/**
 * type denoting that expressions that return a vec4 or loops can be considered
 * "effects"
 */
type EffectElement = ExprVec4 | EffectLoop;

/**
 * map of names to uniform locations with a counter for how many times they have
 * been updated in the current loop
 */
export interface UniformLocs {
  // the counter is what enables expressions to exist across multiple programs
  [name: string]: { locs: WebGLUniformLocation[]; counter: number };
}

/** @ignore */
const V_SOURCE = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}\n`;

/** setting for min and max texture filtering modes */
type FilterMode = "linear" | "nearest";
/** setting for clamp */
type ClampMode = "clamp" | "wrap";

/** extra texture options for the merger */
interface MergerOptions {
  /** min filtering mode for the texture */
  minFilterMode?: FilterMode;
  /** max filtering mode for the texture */
  maxFilterMode?: FilterMode;
  /** how the edges of the texture should be handled */
  edgeMode?: ClampMode;
  /** textures or images to use as extra channels */
  channels?: (TexImageSource | WebGLTexture | null)[];
}

/** @ignore */
export interface TexInfo {
  front: TexWrapper;
  back: TexWrapper;
  scene: TexWrapper | undefined;
  bufTextures: TexWrapper[];
}

/** useful for debugging */
export interface TexWrapper {
  name: string;
  tex: WebGLTexture;
}

/** class that can merge effects */
export class Merger {
  /** the context to render to */
  readonly gl: WebGL2RenderingContext;
  /** the context to apply post-processing to */
  private source: TexImageSource | WebGLTexture;
  tex: TexInfo;
  private framebuffer: WebGLFramebuffer;
  private uniformLocs: UniformLocs = {};
  //private effectLoop: EffectLoop;
  private programMap: ProgramMap;
  private programLoop: WebGLProgramLoop;
  /** additional channels */
  private channels: (TexImageSource | WebGLTexture | null)[] = [];
  private options: MergerOptions | undefined;
  private vertexBuffer: WebGLBuffer;
  private vShader: WebGLShader;
  private fShaders: WebGLShader[] = [];
  textureMode: boolean;

  /**
   * constructs the object that runs the effects
   * @param effects list of effects that define the final effect
   * @param source the source image or texture
   * @param gl the target rendering context
   * @param options additional options for the texture
   */
  constructor(
    effects: (Vec4 | EffectLoop)[] | EffectDictionary,
    source: TexImageSource | WebGLTexture,
    gl: WebGL2RenderingContext,
    options?: MergerOptions
  ) {
    this.textureMode = source instanceof WebGLTexture;
    // set channels if provided with channels
    if (options?.channels !== undefined) this.channels = options?.channels;
    if (!(effects instanceof EffectDictionary)) {
      effects = new EffectDictionary({ default: effects });
    }

    // add the copy to scene texture if in texture mode
    if (this.textureMode) {
      if (settings.verbosity > 1) {
        console.log("we are in texture mode!");
      }
      for (const name in effects.effectMap) {
        const list = effects.effectMap[name];
        list.unshift(loop([input()]).target(-1));
      }
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
    if (vertexBuffer === null) {
      throw new Error("problem creating vertex buffer");
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    const vertexArray = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    const triangles = new Float32Array(vertexArray);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, triangles, this.gl.STATIC_DRAW);
    // save the vertex buffer reference just so we can delete it later
    this.vertexBuffer = vertexBuffer;

    // compile the simple vertex shader (2 big triangles)
    const vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (vShader === null) {
      throw new Error("problem creating the vertex shader");
    }
    // save the vertex shader reference just so we can delete it later
    this.vShader = vShader;

    this.gl.shaderSource(vShader, V_SOURCE);
    this.gl.compileShader(vShader);

    // make textures
    this.tex = {
      // make the front texture the source if we're given a texture instead of
      // an image
      back: {
        name: "orig_back",
        tex:
          source instanceof WebGLTexture
            ? source
            : makeTexture(this.gl, this.options),
      },
      front: { name: "orig_front", tex: makeTexture(this.gl, this.options) },
      scene: undefined,
      bufTextures: [],
    };

    // create the framebuffer
    const framebuffer = gl.createFramebuffer();
    if (framebuffer === null) {
      throw new Error("problem creating the framebuffer");
    }
    this.framebuffer = framebuffer;

    const { programMap, needs } = effects.toProgramMap(
      this.gl,
      this.vShader,
      this.uniformLocs,
      this.fShaders
    );
    this.programMap = programMap;
    if (needs.sceneBuffer || this.textureMode) {
      // we always create a scene texture if we're in texture mode
      this.tex.scene = {
        name: "scene",
        tex: makeTexture(this.gl, this.options),
      };
    }
    if (programMap["default"] === undefined) {
      throw new Error("no default program");
    }
    this.programLoop = programMap["default"];

    // create x amount of empty textures based on buffers needed
    const channelsNeeded = Math.max(...needs.extraBuffers) + 1;
    const channelsSupplied = this.channels.length;
    if (channelsNeeded > channelsSupplied) {
      throw new Error("not enough channels supplied for this effect");
    }

    for (let i = 0; i < this.channels.length; i++) {
      const texOrImage = this.channels[i];
      if (!(texOrImage instanceof WebGLTexture)) {
        // create a new texture; we will update this with the image source every draw
        const texture = makeTexture(this.gl, this.options);
        this.tex.bufTextures.push({ name: "tex_channel_" + i, tex: texture });
      } else {
        // this is already a texture; the user will handle updating this
        this.tex.bufTextures.push({
          name: "img_channel_" + i,
          tex: texOrImage,
        });
      }
    }

    if (settings.verbosity > 0) {
      console.log(effects);
      console.log(this.programMap);
    }
  }

  /**
   * use the source and channels to draw effect to target context; mouse
   * position (as with all positions) are stored from the bottom left corner as
   * this is how texture data is stored
   * @param timeVal number to set the time uniform to (supply this if you plan to
   * use [[time]])
   * @param mouseX the x position of the mouse (supply this if you plan to use
   * [[mouse]] or [[nmouse]])
   * @param mouseY the y position of the mouse (supply this if you plan to use
   * [[mouse]] or [[nmouse]])
   */
  draw(timeVal = 0, mouseX = 0, mouseY = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + settings.offset);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex.back.tex);
    sendTexture(this.gl, this.source);
    // TODO only do unbinding and rebinding in texture mode
    // TODO see if we need to unbind
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    // bind the scene buffer
    if (
      this.programLoop.getTotalNeeds().sceneBuffer &&
      this.tex.scene !== undefined
    ) {
      this.gl.activeTexture(this.gl.TEXTURE1 + settings.offset);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex.scene.tex);
      sendTexture(this.gl, this.source);
      // TODO see if we need to unbind
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    // bind the additional buffers
    let counter = 0;
    for (const b of this.channels) {
      // TODO check for texture limit
      this.gl.activeTexture(this.gl.TEXTURE2 + counter + settings.offset);
      this.gl.bindTexture(
        this.gl.TEXTURE_2D,
        this.tex.bufTextures[counter].tex
      );
      sendTexture(this.gl, b);
      // TODO see if we need to unbind (this gets rid of the error)
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      counter++;
    }

    this.programLoop.run(
      this.gl,
      this.tex,
      this.framebuffer,
      this.uniformLocs,
      this.programLoop.last,
      { timeVal: timeVal, mouseX: mouseX, mouseY: mouseY }
    );
  }

  /**
   * delete all resources created by construction of this [[Merger]]; use right before
   * intentionally losing a reference to this merger object. this is useful if you want
   * to construct another [[Merger]] to use new effects
   */
  delete() {
    // TODO do we have to do something with VertexAttribArray?
    // call bind with null on all textures
    for (let i = 0; i < 2 + this.tex.bufTextures.length; i++) {
      // this gets rid of final texture, scene texture and channels
      this.gl.activeTexture(this.gl.TEXTURE0 + i + settings.offset);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
    // call bind with null on all vertex buffers (just 1)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    // call bind with null on all frame buffers (just 1)
    // (this might be redundant because this happens at end of draw call)
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    // delete all programs
    this.programLoop.delete(this.gl);
    // delete all textures
    this.gl.deleteTexture(this.tex.front.tex);
    this.gl.deleteTexture(this.tex.back.tex);
    for (const c of this.tex.bufTextures) {
      this.gl.deleteTexture(c.tex);
    }
    // delete all vertex buffers (just 1)
    this.gl.deleteBuffer(this.vertexBuffer);
    // delete all frame buffers (just 1)
    this.gl.deleteFramebuffer(this.framebuffer);
    // delete all vertex shaders (just 1)
    this.gl.deleteShader(this.vShader);
    // delete all fragment shaders
    for (const f of this.fShaders) {
      this.gl.deleteShader(f);
    }
  }

  /**
   * changes the current program loop
   * @param str key in the program map
   */
  changeProgram(str: string) {
    if (this.programMap[str] === undefined) {
      throw new Error(`program "${str}" doesn't exist on this merger`);
    }
    this.programLoop = this.programMap[str];
  }
}

/** creates a texture given a context and options */
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

/** copies onto texture */
export function sendTexture(
  gl: WebGL2RenderingContext,
  src: TexImageSource | WebGLTexture | null
) {
  // if you are using textures instead of images, the user is responsible for
  // updating that texture, so just return
  if (src instanceof WebGLTexture || src === null) return;
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
}
