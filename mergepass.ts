import { Effect } from "./effect";

const BOILERPLATE = `#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uSampler;
uniform mediump float uTime;
uniform mediump vec2 uResolution;\n`;

const FRAG_SET = `\n  gl_FragColor = texture2D(uSampler, gl_FragCoord.xy / uResolution);`;
// the above line, which gets placed as the first line of `main`, enables allows
// multiple shaders to be chained together, which works for shaders that don't
// need to use `uSampler` for anything other than the current pixel

// TODO should boilerplate be prepended to this?
const V_SOURCE = `attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}\n`;

// TODO send down shared uniforms

export class Merger {
  private effects: Effect[];
  private fShaders: WebGLShader[] = [];
  private programs: WebGLProgram[] = [];
  /** the context to render to */
  private gl: WebGL2RenderingContext;
  /** the context to apply post-processing to */
  private source: RenderingContext;
  private vShader: WebGLShader;
  private texFront: WebGLTexture;
  private texBack: WebGLTexture;
  private framebuffer: WebGLFramebuffer;

  constructor(
    effects: Effect[],
    source: RenderingContext,
    gl: WebGL2RenderingContext
  ) {
    this.effects = effects;
    this.source = source;
    this.gl = gl;

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
      throw new Error("problem creating back texture");
    }

    // bind the texture after creating it
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // TODO see if this is needed with webgl2
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );

    // how to map texture eleement
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );

    this.sendTexture(this.source.canvas);

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
    let code = BOILERPLATE;
    let calls = "\n";

    // using this style of loop since we need to do something different on the
    // last element and also know the next element
    for (let i = 0; i < this.effects.length; i++) {
      /** code for each function call to each shader pass */
      const e = this.effects[i];
      const next = this.effects[i + 1];
      // replace the main function
      const replacedFunc = "pass" + i + "()";
      const replacedCode = e.fShaderSource.replace(/main\s*\(\)/, replacedFunc);
      code += "\n" + replacedCode + "\n";
      calls += "  " + replacedFunc + ";\n";

      // break of the merge if the next effect or the current effect needs to
      // ping pong, or if we are at the end of the list of effects
      if (e.pingPongNum !== 0 || next === undefined || next.pingPongNum !== 0) {
        // set up the fragment shader
        const fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        if (fShader === null) {
          throw new Error("problem creating fragment shader");
        }

        const fullCode = code + "\nvoid main () {" + FRAG_SET + calls + "}";
        this.gl.shaderSource(fShader, fullCode);
        this.gl.compileShader(fShader);

        // set up the program
        const program = this.gl.createProgram();
        if (program === null) {
          throw new Error("problem creating program");
        }
        // TODO wrap these in functions; do better code generation
        this.gl.attachShader(program, this.vShader);
        this.gl.attachShader(program, fShader);
        console.log("vertex shader info log");
        console.log(this.gl.getShaderInfoLog(this.vShader));
        console.log("fragment shader info log");
        console.log(this.gl.getShaderInfoLog(fShader));
        this.gl.linkProgram(program);
        this.gl.useProgram(program);

        // add the shader and program to the lists
        this.fShaders.push(fShader);
        this.programs.push(program);

        // set the uniform resolution (every program has this uniform)
        const uResolution = this.gl.getUniformLocation(program, "uResolution");
        this.gl.uniform2f(
          uResolution,
          this.gl.canvas.width,
          this.gl.canvas.height
        );

        console.log(fullCode);

        // clear the source code to start merging new shader source
        code = BOILERPLATE;
      }
    }
  }

  draw() {
    for (const program of this.programs) {
      this.gl.useProgram(program);
      // allows us to write to `texFront`
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        this.texFront,
        0
      );
      //this.sendTexture(this.source.canvas);

      // allows us to read from `texBack`
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texBack);

      // TODO does this need to be in the loop?
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      // swap the textures
      [this.texBack, this.texFront] = [this.texFront, this.texBack];

      // go back to the default framebuffer object
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
  }
}
