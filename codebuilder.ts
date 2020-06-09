import { Effect, uniformGLSLTypeStr } from "./effect";
import { EffectLoop, UniformLocs } from "./mergepass";
import { WebGLProgramLoop } from "./webglprogramloop";

// the line below, which gets placed as the first line of `main`, enables allows
// multiple shaders to be chained together, which works for shaders that don't
// need to use `uSampler` for anything other than the current pixel
const FRAG_SET = `  gl_FragColor = texture2D(uSampler, gl_FragCoord.xy / uResolution);\n`;

export const BOILERPLATE = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uSampler;
uniform mediump float uTime;
uniform mediump vec2 uResolution;\n`;

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
    this.addEffectLoop(effectLoop, 1);
  }
  private addEffectLoop(
    effectLoop: EffectLoop,
    indentLevel: number,
    topLevel = true
  ) {
    const needsLoop = !topLevel && effectLoop.repeat.num > 1;
    if (needsLoop) {
      const iName = "i" + this.counter;
      indentLevel++;
      const forStart =
        "  ".repeat(indentLevel - 1) +
        `for (int ${iName} = 0; ${iName} < ${effectLoop.repeat.num}; ${iName}++) {`;
      this.calls.push(forStart);
    }
    for (const e of effectLoop.effects) {
      if (e instanceof Effect) {
        this.effects.push(e);
        const name = `effect${this.counter}()`;
        const func = e.fShaderSource.replace(/main\s*\(\)/, name);
        this.calls.push("  ".repeat(indentLevel) + name + ";");
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
        this.addEffectLoop(e, indentLevel, false);
      }
    }
    if (needsLoop) {
      this.calls.push("  ".repeat(indentLevel - 1) + "}");
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
      "\nvoid main () {\n" +
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
