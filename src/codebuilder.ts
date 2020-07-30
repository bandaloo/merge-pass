import { BuildInfo, Expr, Needs } from "./exprs/expr";
import { EffectLoop, UniformLocs } from "./mergepass";
import { WebGLProgramLoop, WebGLProgramLeaf } from "./webglprogramloop";
import { settings } from "./settings";

/** @ignore */
const FRAG_SET = `  gl_FragColor = texture2D(uSampler, gl_FragCoord.xy / uResolution);\n`;

/** @ignore */
const SCENE_SET = `uniform sampler2D uSceneSampler;\n`;

/** @ignore */
const TIME_SET = `uniform mediump float uTime;\n`;

/** @ignore */
const MOUSE_SET = `uniform mediump vec2 uMouse;\n`;

/** @ignore */
const COUNT_SET = `uniform int uCount;\n`;

/** @ignore */
const BOILERPLATE = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uSampler;
uniform mediump vec2 uResolution;\n`;

/**
 * returns the string name of the sampler uniform for code generation purposes
 * @param num channel number to sample from
 */
export function channelSamplerName(num: number) {
  // texture 2 sampler has number 0 (0 and 1 are used for back buffer and scene)
  return num === -1 ? "uSampler" : `uBufferSampler${num}`;
}

/**
 * returns the string of the declaration of the sampler for code generation
 * purposes
 * @param num channel number to sample from
 */
function channelSamplerDeclaration(num: number) {
  return `uniform sampler2D ${channelSamplerName(num)};`;
}

/** class that manages generation and compilation of GLSL code */
export class CodeBuilder {
  private calls: string[] = [];
  private externalFuncs: Set<string> = new Set();
  private uniformDeclarations: Set<string> = new Set();
  private counter = 0;
  /** flat array of expressions within loop for attaching uniforms */
  private exprs: Expr[];
  private baseLoop: EffectLoop;
  private totalNeeds: Needs;

  constructor(effectLoop: EffectLoop) {
    this.baseLoop = effectLoop;
    const buildInfo: BuildInfo = {
      uniformTypes: {},
      externalFuncs: new Set<string>(),
      exprs: [],
      // update me on change to needs
      needs: {
        centerSample: false,
        neighborSample: false,
        sceneBuffer: false,
        timeUniform: false,
        mouseUniform: false,
        passCount: false,
        extraBuffers: new Set(),
      },
    };
    this.addEffectLoop(effectLoop, 1, buildInfo);
    // add all the types to uniform declarations from the `BuildInfo` instance
    for (const name in buildInfo.uniformTypes) {
      const typeName = buildInfo.uniformTypes[name];
      this.uniformDeclarations.add(`uniform mediump ${typeName} ${name};`);
    }
    // add all external functions from the `BuildInfo` instance
    buildInfo.externalFuncs.forEach((func) => this.externalFuncs.add(func));
    this.totalNeeds = buildInfo.needs;
    this.exprs = buildInfo.exprs;
  }

  private addEffectLoop(
    effectLoop: EffectLoop,
    indentLevel: number,
    buildInfo: BuildInfo,
    topLevel = true
  ) {
    const needsLoop = !topLevel && effectLoop.loopInfo.num > 1;
    if (needsLoop) {
      const iName = "i" + this.counter;
      indentLevel++;
      const forStart =
        "  ".repeat(indentLevel - 1) +
        `for (int ${iName} = 0; ${iName} < ${effectLoop.loopInfo.num}; ${iName}++) {`;
      this.calls.push(forStart);
    }

    for (const e of effectLoop.effects) {
      if (e instanceof Expr) {
        e.parse(buildInfo);
        this.calls.push(
          "  ".repeat(indentLevel) + "gl_FragColor = " + e.sourceCode + ";"
        );
        this.counter++;
      } else {
        this.addEffectLoop(e, indentLevel, buildInfo, false);
      }
    }
    if (needsLoop) {
      this.calls.push("  ".repeat(indentLevel - 1) + "}");
    }
  }

  /** generate the code and compile the program into a loop */
  compileProgram(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs,
    shaders: WebGLShader[] = []
  ) {
    // set up the fragment shader
    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (fShader === null) {
      throw new Error("problem creating fragment shader");
    }
    const fullCode =
      BOILERPLATE +
      (this.totalNeeds.sceneBuffer ? SCENE_SET : "") +
      (this.totalNeeds.timeUniform ? TIME_SET : "") +
      (this.totalNeeds.mouseUniform ? MOUSE_SET : "") +
      (this.totalNeeds.passCount ? COUNT_SET : "") +
      Array.from(this.totalNeeds.extraBuffers)
        .map((n) => channelSamplerDeclaration(n))
        .join("\n") +
      "\n" +
      [...this.uniformDeclarations].join("\n") +
      "\n" +
      [...this.externalFuncs].join("\n") +
      "\n" +
      "void main() {\n" +
      (this.totalNeeds.centerSample ? FRAG_SET : "") +
      this.calls.join("\n") +
      "\n}";
    if (settings.verbosity > 0) console.log(fullCode);
    gl.shaderSource(fShader, fullCode);
    gl.compileShader(fShader);
    // set up the program
    const program = gl.createProgram();
    if (program === null) {
      throw new Error("problem creating program");
    }

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    shaders.push(fShader);
    const shaderLog = (name: string, shader: WebGLShader) => {
      const output = gl.getShaderInfoLog(shader);
      if (output) console.log(`${name} shader info log\n${output}`);
    };
    shaderLog("vertex", vShader);
    shaderLog("fragment", fShader);
    gl.linkProgram(program);
    // we need to use the program here so we can get uniform locations
    gl.useProgram(program);
    // find all uniform locations and add them to the dictionary
    for (const expr of this.exprs) {
      for (const name in expr.uniformValChangeMap) {
        const location = gl.getUniformLocation(program, name);
        if (location === null) {
          throw new Error("couldn't find uniform " + name);
        }
        // TODO enforce unique names in the same program
        if (uniformLocs[name] === undefined) {
          uniformLocs[name] = { locs: [], counter: 0 };
        }
        // assign the name to the location
        uniformLocs[name].locs.push(location);
      }
    }
    // set the uniform resolution (every program has this uniform)
    const uResolution = gl.getUniformLocation(program, "uResolution");
    gl.uniform2f(uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);

    if (this.totalNeeds.sceneBuffer) {
      // TODO allow for texture options for scene texture
      const location = gl.getUniformLocation(program, "uSceneSampler");
      // put the scene buffer in texture 1 (0 is used for the backbuffer)
      gl.uniform1i(location, 1 + settings.offset);
    }
    // set all sampler uniforms
    for (const b of this.totalNeeds.extraBuffers) {
      const location = gl.getUniformLocation(program, channelSamplerName(b));
      // offset the texture location by 2 (0 and 1 are used for scene and original)
      gl.uniform1i(location, b + 2 + settings.offset);
    }
    // set the default sampler if there is an offset
    if (settings.offset !== 0) {
      const location = gl.getUniformLocation(program, "uSampler");
      gl.uniform1i(location, settings.offset);
    }

    // TODO do we need to do this every time?
    // get attribute
    const position = gl.getAttribLocation(program, "aPosition");
    // enable the attribute
    gl.enableVertexAttribArray(position);
    // points to the vertices in the last bound array buffer
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    return new WebGLProgramLoop(
      new WebGLProgramLeaf(program, this.totalNeeds, this.exprs),
      this.baseLoop.loopInfo,
      gl
    );
  }
}
