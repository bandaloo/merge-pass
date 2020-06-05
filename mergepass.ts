import {
  Effect,
  uniformGLSLTypeStr,
  uniformGLSLTypeNum,
  RawFloat,
  RawVec2,
  RawVec3,
  RawVec4,
} from "./effect";

interface UniformLocs {
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
  private effects: Effect[];
  private fShaders: WebGLShader[] = [];
  private programs: WebGLProgram[] = [];
  private repeatNums: number[] = [];
  /** the context to render to */
  private gl: WebGL2RenderingContext;
  /** the context to apply post-processing to */
  private source: TexImageSource;
  private vShader: WebGLShader;
  private texFront: WebGLTexture;
  private texBack: WebGLTexture;
  private framebuffer: WebGLFramebuffer;
  private uniformLocs: UniformLocs = {};
  /** effects grouped by program */
  private lumpedEffects: Effect[][] = [];

  private options: MergerOptions | undefined;

  constructor(
    effects: Effect[],
    source: TexImageSource,
    gl: WebGL2RenderingContext,
    options?: MergerOptions
  ) {
    this.effects = effects;
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
    this.vShader = vShader;
    this.gl.shaderSource(vShader, V_SOURCE);
    this.gl.compileShader(vShader);

    // make textures
    this.texBack = this.makeTexture();
    this.texFront = this.makeTexture();

    // create the framebuffer
    const framebuffer = gl.createFramebuffer();
    if (framebuffer === null) {
      throw new Error("problem creating the framebuffer");
    }
    this.framebuffer = framebuffer;

    // generate the fragment shaders and programs
    this.generateCode();
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
    let code = "";
    let calls = "\n";
    let needsCenterSample = false;
    let externalFuncs: string[] = [];
    let uniformDeclarations: string[] = [];
    let effectLump: Effect[] = [];

    // using this style of loop since we need to do something different on the
    // last element and also know the next element
    for (let i = 0; i < this.effects.length; i++) {
      /** code for each function call to each shader pass */
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
        if (!externalFuncs.includes(func)) externalFuncs.push("\n" + func);
      }

      for (const name in e.uniforms) {
        const uniformVal = e.uniforms[name];
        const typeName = uniformGLSLTypeStr(uniformVal.val);
        uniformDeclarations.push(`uniform mediump ${typeName} ${name};`);
      }

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
  }

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

  draw() {
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
  }
}
