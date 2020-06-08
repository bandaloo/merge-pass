import { Effect, uniformGLSLTypeStr } from "./effect";

interface LoopInfo {
  num: number;
  func?: (arg0: number) => void;
}

// TODO move to its own file
export class CodeBuilder {
  private funcs: string[] = [];
  private calls: string[] = [];
  private externalFuncs: string[] = [];
  private uniformDeclarations: string[] = [];
  private counter = 0;
  /** flat array of effects within loop for attaching uniforms */
  private effects: Effect[] = [];
  private baseLoop: EffectLoop;

  // TODO indentation level?

  constructor(effectLoop: EffectLoop) {
    this.baseLoop = effectLoop;
    //this.includeCenterSample = effectLoop.getNeeds("centerSample");
    //this.repeatNum = effectLoop.repeat.num;
    this.addEffectLoop(effectLoop);
  }

  private addEffectLoop(effectLoop: EffectLoop, topLevel = true) {
    const needsLoop = !topLevel && effectLoop.repeat.num > 1;
    if (needsLoop) {
      const iName = "i" + this.counter;
      const forStart = `for (int ${iName} = 0; ${iName} < ${effectLoop.repeat.num}; ${iName}++) {`;
      this.calls.push(forStart);
    }
    for (const e of effectLoop.effects) {
      if (e instanceof Effect) {
        this.effects.push(e);
        const name = `effect${this.counter}()`;
        const func = e.fShaderSource.replace(/main\s*\(\)/, name);
        this.calls.push(name + ";");
        this.counter++;
        this.funcs.push(func);

        for (const func of e.externalFuncs) {
          if (!this.externalFuncs.includes("\n" + func))
            this.externalFuncs.push("\n" + func);
        }

        for (const name in e.uniforms) {
          const uniformVal = e.uniforms[name];
          const typeName = uniformGLSLTypeStr(uniformVal.val);
          this.uniformDeclarations.push(`uniform mediump ${typeName} ${name};`);
        }
      } else {
        this.addEffectLoop(e, false);
      }
    }
    if (needsLoop) {
      this.calls.push("}");
    }
  }

  compileProgram(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs
  ) {
    // set up the fragment shader
    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (fShader === null) {
      throw new Error("problem creating fragment shader");
    }

    const fullCode =
      BOILERPLATE +
      this.uniformDeclarations.join("\n") +
      this.externalFuncs.join("") +
      "\n" +
      this.funcs.join("\n") +
      "\nvoid main () {" +
      (this.baseLoop.getNeeds("centerSample") ? FRAG_SET : "") +
      this.calls.join("\n") +
      "\n}";

    gl.shaderSource(fShader, fullCode);
    gl.compileShader(fShader);

    // set up the program
    const program = gl.createProgram();
    if (program === null) {
      throw new Error("problem creating program");
    }
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    const shaderLog = (name: string, shader: WebGLShader) => {
      const output = gl.getShaderInfoLog(shader);
      if (output) console.log(`${name} shader info log\n${output}`);
    };
    shaderLog("vertex", vShader);
    shaderLog("fragment", fShader);
    gl.linkProgram(program);

    // we need to use the program here so we can get uniform locations
    gl.useProgram(program);

    console.log(fullCode);

    // find all uniform locations and add them to the dictionary
    for (const effect of this.effects) {
      for (const name in effect.uniforms) {
        const location = gl.getUniformLocation(program, name);
        if (location === null) {
          throw new Error("couldn't find uniform " + name);
        }
        if (uniformLocs[name] !== undefined) {
          throw new Error("uniforms have to all have unique names");
        }
        uniformLocs[name] = location;
      }
    }

    // set the uniform resolution (every program has this uniform)
    const uResolution = gl.getUniformLocation(program, "uResolution");
    gl.uniform2f(uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // get attribute
    const position = gl.getAttribLocation(program, "aPosition");
    // enable the attribute
    gl.enableVertexAttribArray(position);
    // this will point to the vertices in the last bound array buffer.
    // In this example, we only use one array buffer, where we're storing
    // our vertices
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    return new WebGLProgramLoop(program, this.baseLoop.repeat, this.effects);
  }
}

export class EffectLoop {
  effects: EffectElement[];
  repeat: LoopInfo;

  constructor(effects: EffectElement[], repeat: LoopInfo) {
    this.effects = effects;
    this.repeat = repeat;
  }

  /** returns true if any sub-effects need neighbor sample down the tree */
  getNeeds(name: "neighborSample" | "centerSample" | "depthBuffer") {
    const bools: boolean[] = this.effects.map((e) => e.getNeeds(name));
    return bools.reduce((acc: boolean, curr: boolean) => acc || curr);
  }

  // TODO test (maybe rewrite) this
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
      if (sampleCount > 1) breakOff();
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
    if (this.getSampleNum() / this.repeat.num <= 1) {
      // if this group only samples neighbors at most once, create program
      const codeBuilder = new CodeBuilder(this);
      return codeBuilder.compileProgram(gl, vShader, uniformLocs);
    }
    // otherwise, regroup and try again on regrouped loops
    // TODO should it be getSampleNum(1)?
    this.effects = this.regroup();
    return new WebGLProgramLoop(
      this.effects.map((e) => e.genPrograms(gl, vShader, uniformLocs)),
      this.repeat
    );
  }
}

type EffectElement = Effect | EffectLoop;

class WebGLProgramLoop {
  program: WebGLProgramElement;
  repeat: LoopInfo;
  effects: Effect[];
  last = false;

  constructor(
    program: WebGLProgramElement,
    repeat: LoopInfo,
    effects: Effect[] = []
  ) {
    this.program = program;
    this.repeat = repeat;
    this.effects = effects;
  }

  draw(
    gl: WebGL2RenderingContext,
    tex: { front: WebGLTexture; back: WebGLTexture },
    framebuffer: WebGLFramebuffer,
    uniformLocs: UniformLocs,
    last = false
  ) {
    for (let i = 0; i < this.repeat.num; i++) {
      const newLast = i === this.repeat.num - 1;
      if (this.program instanceof WebGLProgram) {
        // TODO figure out way to move this from loop
        gl.useProgram(this.program);
        // effects list is populated
        if (i === 0) {
          for (const effect of this.effects) {
            effect.applyUniforms(gl, uniformLocs);
          }
        }
        if (newLast && last && this.last) {
          // TODO need to send `this.last` all the way down
          // we are on the final pass of the final loop, so draw screen by
          // setting to the default framebuffer
          console.log("we are on the last");
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          console.log("intermediate step");
          // we have to bounce between two textures
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          // use the framebuffer to write to front texture
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            tex.front,
            0
          );
          // swap the textures
          //console.log("swapping textures");
          //gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        // allows us to read from `texBack`
        // default sampler is 0, so `uSampler` uniform will always sample from texture 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex.back);
        [tex.back, tex.front] = [tex.front, tex.back];

        // go back to the default framebuffer object
        // TODO can we remove this?
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // use our last program as the draw program
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        if (this.repeat.func !== undefined) {
          this.repeat.func(i);
        }
        for (const p of this.program) {
          p.draw(gl, tex, framebuffer, uniformLocs, newLast);
        }
      }
    }
  }
}

export type WebGLProgramElement = WebGLProgram | WebGLProgramLoop[];

// TODO we don't really want to export this
export interface UniformLocs {
  [name: string]: WebGLUniformLocation;
}

const BOILERPLATE = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uSampler;
uniform mediump float uTime;
uniform mediump vec2 uResolution;\n`;

// the line below, which gets placed as the first line of `main`, enables allows
// multiple shaders to be chained together, which works for shaders that don't
// need to use `uSampler` for anything other than the current pixel
const FRAG_SET = `\n  gl_FragColor = texture2D(uSampler, gl_FragCoord.xy / uResolution);`;

const V_SOURCE = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}\n`;

type FilterMode = "linear" | "nearest";

interface MergerOptions {
  minFilterMode?: FilterMode;
  maxFilterMode?: FilterMode;
}

export class Merger {
  /** the context to render to */
  gl: WebGL2RenderingContext;
  /** the context to apply post-processing to */
  private source: TexImageSource;
  private tex: { front: WebGLTexture; back: WebGLTexture };
  private framebuffer: WebGLFramebuffer;
  private uniformLocs: UniformLocs = {};
  private effectLoop: EffectLoop;
  private programLoop: WebGLProgramLoop;

  private options: MergerOptions | undefined;

  constructor(
    effects: (Effect | EffectLoop)[],
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
    //this.vShader = vShader;
    this.gl.shaderSource(vShader, V_SOURCE);
    this.gl.compileShader(vShader);

    // make textures
    this.tex = { front: this.makeTexture(), back: this.makeTexture() };

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
      if (currProgramLoop.program instanceof WebGLProgram) {
        // we traveled right and hit a program, so it must be the last
        currProgramLoop.last = true;
        atBottom = true;
      } else {
        // set the current program loop to the last in the list
        currProgramLoop =
          currProgramLoop.program[currProgramLoop.program.length - 1];
      }
    }
    console.log("program loop");
    console.log(this.programLoop);
  }

  private makeTexture() {
    const texture = this.gl.createTexture();
    if (texture === null) {
      throw new Error("problem creating texture");
    }

    // flip the order of the pixels, or else it displays upside down
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    // bind the texture after creating it
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );

    const filterMode = (f: undefined | FilterMode) =>
      f === undefined || f === "linear" ? this.gl.LINEAR : this.gl.NEAREST;

    // how to map texture element
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      filterMode(this.options?.minFilterMode)
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      filterMode(this.options?.maxFilterMode)
    );

    return texture;
  }

  private sendTexture(src: TexImageSource) {
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      src
    );
  }

  draw() {
    //this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex.back);
    this.sendTexture(this.source);
    // swap textures before beginning draw
    this.programLoop.draw(
      this.gl,
      this.tex,
      this.framebuffer,
      this.uniformLocs
    );
  }
}
