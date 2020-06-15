import { EffectLoop, UniformLocs } from "./mergepass";
import { WebGLProgramLoop } from "./webglprogramloop";
import { BuildInfo, Expr, ExprVec4 } from "./expressions/expr";

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
  //private funcs: string[] = [];
  private calls: string[] = [];
  //private externalFuncs: string[] = [];
  //private uniformDeclarations: string[] = [];
  private externalFuncs: Set<string> = new Set();
  private uniformDeclarations: Set<string> = new Set();
  private counter = 0;
  /** flat array of expressions within loop for attaching uniforms */
  private exprs: Expr[];
  private baseLoop: EffectLoop;
  //private uniformLocs: UniformLocs = {};
  //private uniformNames: string[];
  constructor(effectLoop: EffectLoop) {
    this.baseLoop = effectLoop;
    const buildInfo: BuildInfo = {
      uniformTypes: {},
      externalFuncs: new Set<string>(),
      exprs: [],
      needs: { centerSample: false, neighborSample: false, depthBuffer: false },
    };
    console.log(effectLoop);
    this.addEffectLoop(effectLoop, 1, buildInfo);
    // add all the types to uniform declarations from the `BuildInfo` instance
    for (const name in buildInfo.uniformTypes) {
      const typeName = buildInfo.uniformTypes[name];
      this.uniformDeclarations.add(`uniform mediump ${typeName} ${name};`);
    }
    //this.uniformNames = Object.keys(buildInfo.uniformTypes);
    // add all external functions from the `BuildInfo` instance
    buildInfo.externalFuncs.forEach((func) => this.externalFuncs.add(func));
    this.exprs = buildInfo.exprs;
  }

  private addEffectLoop(
    effectLoop: EffectLoop,
    indentLevel: number,
    buildInfo: BuildInfo,
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
      if (e instanceof Expr) {
        e.parse(buildInfo);
        //this.exprs.push(e);
        //const name = `effect${this.counter}()`;
        //const func = e.sourceCode.replace(/main\s*\(\)/, name);
        this.calls.push(
          "  ".repeat(indentLevel) + "gl_FragColor = " + e.sourceCode + ";"
        );
        this.counter++;
        //this.funcs.push(func);
      } else {
        this.addEffectLoop(e, indentLevel, buildInfo, false);
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
      [...this.uniformDeclarations].join("\n") +
      [...this.externalFuncs].join("") +
      "\n" +
      //this.funcs.join("\n") +
      "\nvoid main () {\n" +
      // TODO replace with needs from buildinfo
      //(this.baseLoop.getNeeds("centerSample") ? FRAG_SET : "") +
      FRAG_SET +
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
    for (const expr of this.exprs) {
      for (const name in expr.uniformValChangeMap) {
        const location = gl.getUniformLocation(program, name);
        if (location === null) {
          throw new Error("couldn't find uniform " + name);
        }
        // makes sure you don't declare uniform with same name
        if (uniformLocs[name] !== undefined) {
          throw new Error("uniforms have to all have unique names");
        }
        // assign the name to the location
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
    return new WebGLProgramLoop(program, this.baseLoop.repeat, this.exprs);
  }
}
