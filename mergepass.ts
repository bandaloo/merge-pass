import {
  Effect,
  uniformGLSLTypeStr,
  uniformGLSLTypeNum,
  RawFloat,
  RawVec2,
  RawVec3,
  RawVec4,
} from "./effect";

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
      console.log(sampleCount);
      if (sampleCount > 1) breakOff();
      prevEffects.push(e);
    }
    // push on all the straggling effects after the grouping is done
    breakOff();
    return regroupedEffects;
  }

  /*
  internalLoopNeedsSample() {
    const bools: boolean[] = this.effects.map(
      (e) =>
        e instanceof EffectLoop &&
        e.repeat.num > 1 &&
        e.getNeeds("neighborSample")
    );
    return bools.reduce((acc: boolean, curr: boolean) => acc || curr);
  }
  */

  /** recursive descent parser for turning effects into programs */
  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs
  ): WebGLProgramLoop {
    if (this.getSampleNum() / this.repeat.num <= 1) {
      // if this group only samples neighbors at most once, create program
      console.log(this);
      console.log("building!");
      const codeBuilder = new CodeBuilder(this);
      return codeBuilder.compileProgram(gl, vShader, uniformLocs);
    }
    // otherwise, regroup and try again on regrouped loops
    // TODO should it be getSampleNum(1)?
    //console.log(this.getSampleNum());
    //console.log(this.effects);
    this.effects = this.regroup();
    console.log("regroup");
    console.log(this.effects);
    return new WebGLProgramLoop(
      this.effects.map((e) => e.genPrograms(gl, vShader, uniformLocs)),
      this.repeat
    );
    /*
    for (const e of this.effects) {
      if (e.getSampleNum() <= 1) {
        // if this group only samples neighbors at most once, create program
        const codeBuilder = new CodeBuilder(this);
        codeBuilder.compileProgram(gl, vShader, uniformLocs);
      }
    }
    */
    /*
    if (!this.internalLoopNeedsSample()) {
      // if this loop does not need to sample neighbors, create program
      const codeBuilder = new CodeBuilder(this);
      return codeBuilder.compileProgram(gl, vShader, uniformLocs);
    } else {
      // return a loop of all effect element program elements
      return new WebGLProgramLoop(
        this.effects.map((e) => e.genPrograms(gl, vShader, uniformLocs)),
        this.repeat,
        []
      );
      // TODO revisit this (don't want to have to pass in [])
    }
    */
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
    uniformLocs: UniformLocs
  ) {
    for (let i = 0; i < this.repeat.num; i++) {
      if (this.program instanceof WebGLProgram) {
        gl.useProgram(this.program);
        // effects list is populated
        if (i === 0) {
          for (const effect of this.effects) {
            effect.applyUniforms(gl, uniformLocs);
          }
        }
        /** to see if we are on last element */
        if (i === this.repeat.num - 1 && this.last) {
          // we are on the final pass of the final loop, so draw screen by
          // setting to the default framebuffer
          //console.log("we are on the last");
          // TODO this is redundant
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          //console.log("intermediate step");
          //console.log(this.program);
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
          // allows us to read from `texBack`
          // default sampler is 0, so `uSampler` uniform will always sample from texture 0
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, tex.back);

          // swap the textures
          //console.log("swapping textures");
          [tex.back, tex.front] = [tex.front, tex.back];
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        // go back to the default framebuffer object
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // use our last program as the draw program
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        for (const p of this.program) {
          p.draw(gl, tex, framebuffer, uniformLocs);
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
  //private effects: Effect[];
  //private fShaders: WebGLShader[] = [];
  //private programs: WebGLProgram[] = [];
  //private repeatNums: number[] = [];
  /** the context to render to */
  gl: WebGL2RenderingContext;
  /** the context to apply post-processing to */
  private source: TexImageSource;
  //private vShader: WebGLShader;
  //private texFront: WebGLTexture;
  //private texBack: WebGLTexture;
  private tex: { front: WebGLTexture; back: WebGLTexture };
  private framebuffer: WebGLFramebuffer;
  private uniformLocs: UniformLocs = {};
  /** effects grouped by program */
  // TODO we don't need this anymore because WebGLProgramLoops group effects and programs
  //private lumpedEffects: Effect[][] = [];
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

    console.log(this.programLoop);
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

  private generateCode() {
    /*
    let code = "";
    let calls = "\n";
    let needsCenterSample = false;
    let externalFuncs: string[] = [];
    let uniformDeclarations: string[] = [];
    let effectLump: Effect[] = [];

    // using this style of loop since we need to do something different on the
    // last element and also know the next element
    for (let i = 0; i < this.effects.length; i++) {
      const e = this.effects[i];
      effectLump.push(e);
      const next = this.effects[i + 1];
      needsCenterSample = needsCenterSample || e.needsCenterSample;
      // replace the main function
      const replacedFunc = "pass" + i + "()";
      const replacedCode = e.fShaderSource.replace(/main\s*\(\)/, replacedFunc);
      code += "\n" + replacedCode + "\n";
      // an effect that samples neighbors cannot just be run in a for loop
      const forStr =
        !e.needsNeighborSample && e.repeatNum > 1
          ? `for (int i = 0; i < ${e.repeatNum}; i++) `
          : "";

      calls += "  " + forStr + replacedFunc + ";\n";

      for (const func of e.externalFuncs) {
        if (!externalFuncs.includes("\n" + func))
          externalFuncs.push("\n" + func);
      }

      for (const name in e.uniforms) {
        const uniformVal = e.uniforms[name];
        const typeName = uniformGLSLTypeStr(uniformVal.val);
        uniformDeclarations.push(`uniform mediump ${typeName} ${name};`);
      }

      // TODO if we encounter a loop that needs to sample neighbors, we need to
      // break off and compile the shader. If the loop does not need to sample
      // neighbors, we can append it to the current code as a for loop
      if (
        next === undefined ||
        (e.needsNeighborSample && e.repeatNum > 1) ||
        next.needsNeighborSample
      ) {
        // set up the fragment shader
        const fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        if (fShader === null) {
          throw new Error("problem creating fragment shader");
        }

        const fullCode =
          BOILERPLATE +
          "\n" +
          uniformDeclarations.join("\n") +
          "\n" +
          externalFuncs.join("\n\n") +
          "\n" +
          code +
          "\nvoid main () {" +
          (needsCenterSample ? FRAG_SET : "") +
          calls +
          "}";

        this.gl.shaderSource(fShader, fullCode);
        this.gl.compileShader(fShader);

        // set up the program
        const program = this.gl.createProgram();
        if (program === null) {
          throw new Error("problem creating program");
        }
        this.gl.attachShader(program, this.vShader);
        this.gl.attachShader(program, fShader);
        console.log("vertex shader info log");
        console.log(this.gl.getShaderInfoLog(this.vShader));
        console.log("fragment shader info log");
        console.log(this.gl.getShaderInfoLog(fShader));
        this.gl.linkProgram(program);

        // we need to use the program here so we can get uniform locations
        this.gl.useProgram(program);

        for (const effect of effectLump) {
          for (const name in effect.uniforms) {
            const location = this.gl.getUniformLocation(program, name);
            if (location === null) {
              throw new Error("couldn't find uniform " + name);
            }
            if (this.uniformLocs[name] !== undefined) {
              throw new Error("uniforms have to all have unique names");
            }
            this.uniformLocs[name] = location;
          }
        }

        // add the shader, the program and the repetitions to the lists
        this.fShaders.push(fShader);
        this.programs.push(program);
        // if the effect doesn't need to sample neighbors, then the repetition
        // of the effect is handled as a for loop in the code generation step,
        // the repeat number can just be 1
        this.repeatNums.push(e.needsNeighborSample ? e.repeatNum : 1);

        // set the uniform resolution (every program has this uniform)
        const uResolution = this.gl.getUniformLocation(program, "uResolution");
        this.gl.uniform2f(
          uResolution,
          this.gl.drawingBufferWidth,
          this.gl.drawingBufferHeight
        );

        const position = this.gl.getAttribLocation(program, "aPosition");
        // enable the attribute
        this.gl.enableVertexAttribArray(position);
        // this will point to the vertices in the last bound array buffer.
        // In this example, we only use one array buffer, where we're storing
        // our vertices
        this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);

        this.lumpedEffects.push(effectLump);

        console.log(fullCode);

        // clear the source code to start merging new shader source
        code = "";
        calls = "\n";
        needsCenterSample = false;
        externalFuncs = [];
        uniformDeclarations = [];
        effectLump = [];
      }
    }
    console.log(this.lumpedEffects);
    */
  }

  /*
  applyUniforms(e: Effect) {
    for (const name in e.uniforms) {
      const loc = this.uniformLocs[name];
      const val = e.uniforms[name].val;
      if (e.uniforms[name].changed) {
        e.uniforms[name].changed = false;
        switch (uniformGLSLTypeNum(val)) {
          case 1:
            const float = val as RawFloat;
            this.gl.uniform1f(loc, float);
            break;
          case 2:
            const vec2 = val as RawVec2;
            this.gl.uniform2f(loc, vec2[0], vec2[1]);
            break;
          case 3:
            const vec3 = val as RawVec3;
            this.gl.uniform3f(loc, vec3[0], vec3[1], vec3[2]);
            break;
          case 4:
            const vec4 = val as RawVec4;
            this.gl.uniform4f(loc, vec4[0], vec4[1], vec4[2], vec4[3]);
        }
      }
    }
  }
  */

  draw() {
    this.sendTexture(this.source);
    // swap textures before beginning draw
    [this.tex.back, this.tex.front] = [this.tex.front, this.tex.back];
    this.programLoop.draw(
      this.gl,
      this.tex,
      this.framebuffer,
      this.uniformLocs
    );

    /*
    let programIndex = 0;
    this.sendTexture(this.source);
    [this.texBack, this.texFront] = [this.texFront, this.texBack];
    for (const program of this.programs) {
      this.gl.useProgram(program);
      const effectLump = this.lumpedEffects[programIndex];
      for (const e of effectLump) {
        this.applyUniforms(e);
      }
      for (let i = 0; i < this.repeatNums[programIndex]; i++) {
        if (
          programIndex === this.programs.length - 1 &&
          i === this.repeatNums[programIndex] - 1
        ) {
          // we are on the final pass of the final program, so draw to screen
          // set to the default framebuffer
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        } else {
          // we have to bounce between two textures
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
          // use the framebuffer to write to front texture
          this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            this.texFront,
            0
          );
        }
        // allows us to read from `texBack`
        // default sampler is 0, so `uSampler` uniform will always sample from texture 0
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texBack);

        [this.texBack, this.texFront] = [this.texFront, this.texBack];
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      }
      programIndex++;
    }
    // swap the textures
    //[this.texBack, this.texFront] = [this.texFront, this.texBack];

    // go back to the default framebuffer object
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    // use our last program as the draw program
    // draw to the screen
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  */
  }
}
