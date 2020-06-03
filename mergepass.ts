import { Effect } from "./effect";

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

// TODO should boilerplate be prepended to this?
const V_SOURCE = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}\n`;

// TODO send down shared uniforms

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

  constructor(
    effects: Effect[],
    source: TexImageSource,
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
      throw new Error("problem creating texture");
    }

    // flip the order of the pixels, or else it displays upside down
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    // bind the texture after creating it
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    //this.sendTexture(this.source.canvas);
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

    // TODO see if this is needed with webgl2
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );

    // how to map texture element
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
    let needsCenterSample = false;

    // using this style of loop since we need to do something different on the
    // last element and also know the next element
    for (let i = 0; i < this.effects.length; i++) {
      /** code for each function call to each shader pass */
      const e = this.effects[i];
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

      // TODO consider when to break off the merge
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
        // TODO do we need to call `useProgram` here?
        this.gl.useProgram(program);

        // add the shader, the program and the repetitions to the lists
        this.fShaders.push(fShader);
        this.programs.push(program);
        // if the effect doesn't need to sample neighbors, then the repetition
        // of the effect is handled as a for loop in the code generation step,
        // the repeat number can just be 1
        this.repeatNums.push(e.needsNeighborSample ? e.repeatNum : 1);

        // TODO see if width and height is right
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

        console.log(fullCode);

        // clear the source code to start merging new shader source
        code = BOILERPLATE;
        calls = "\n";
        needsCenterSample = false;
      }
    }
  }

  draw() {
    /*
    for (const program of this.programs) {
      this.gl.useProgram(program);

      // TODO maybe get rid of this
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
      // TODO maybe get rid of this too
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
      // allows us to write to `texFront`
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        this.texFront,
        0
      );
      this.sendTexture(this.source.canvas);

      console.log("drawing");

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
    */

    let programIndex = 0;
    this.sendTexture(this.source);
    [this.texBack, this.texFront] = [this.texFront, this.texBack];
    for (const program of this.programs) {
      for (let i = 0; i < this.repeatNums[programIndex]; i++) {
        this.gl.useProgram(program);
        if (
          programIndex === this.programs.length - 1 &&
          i === this.repeatNums[programIndex] - 1
        ) {
          // we are on the final pass of the final program, so draw to screen
          console.log("final render pass");
          // set to the default framebuffer
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
          // TODO see if we need this
          this.gl.viewport(
            0,
            0,
            this.gl.drawingBufferWidth,
            this.gl.drawingBufferHeight
          );
        } else {
          console.log("intermediate render pass");
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
          // TODO see if we need this
          this.gl.viewport(
            0,
            0,
            this.gl.drawingBufferWidth,
            this.gl.drawingBufferHeight
          );

          // allows us to read from `texBack`
          // default sampler is 0, so `uSampler` uniform will always sample from texture 0
          this.gl.activeTexture(this.gl.TEXTURE0);
          this.gl.bindTexture(this.gl.TEXTURE_2D, this.texBack);
        }

        [this.texBack, this.texFront] = [this.texFront, this.texBack];
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      }
      programIndex++;
    }
    // swap the textures
    [this.texBack, this.texFront] = [this.texFront, this.texBack];

    // go back to the default framebuffer object
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    // use our last program as the draw program
    // draw to the screen
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
