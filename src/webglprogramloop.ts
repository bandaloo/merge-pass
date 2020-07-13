import { Expr, Needs } from "./exprs/expr";
import { LoopInfo, TexInfo, UniformLocs } from "./mergepass";

export type WebGLProgramElement = WebGLProgramLeaf | WebGLProgramLoop[];

// update me on change to needs
export function updateNeeds(acc: Needs, curr: Needs): Needs {
  return {
    neighborSample: acc.neighborSample || curr.neighborSample,
    centerSample: acc.centerSample || curr.centerSample,
    sceneBuffer: acc.sceneBuffer || curr.sceneBuffer,
    timeUniform: acc.timeUniform || curr.timeUniform,
    mouseUniform: acc.mouseUniform || curr.mouseUniform,
    extraBuffers: new Set([...acc.extraBuffers, ...curr.extraBuffers]),
  };
}

/** values to set the default uniforms `uTime` and `uMouse` to */
interface DefaultUniforms {
  /** `uTime` value */
  timeVal: number;
  /** x component of `uMouse` */
  mouseX: number;
  /** y component of `uMouse` */
  mouseY: number;
}

export class WebGLProgramLeaf {
  program: WebGLProgram;
  totalNeeds: Needs;
  effects: Expr[];

  constructor(program: WebGLProgram, totalNeeds: Needs, effects: Expr[]) {
    this.program = program;
    this.totalNeeds = totalNeeds;
    this.effects = effects;
  }
}

/** recursive data structure of compiled programs */
export class WebGLProgramLoop {
  programElement: WebGLProgramElement;
  loopInfo: LoopInfo;
  //effects: Expr[];
  last = false;
  //totalNeeds: Needs | undefined;
  timeLoc?: WebGLUniformLocation;
  mouseLoc?: WebGLUniformLocation;

  constructor(
    programElement: WebGLProgramElement,
    loopInfo: LoopInfo,
    gl: WebGL2RenderingContext
  ) {
    this.programElement = programElement;
    this.loopInfo = loopInfo;
    if (this.programElement instanceof WebGLProgramLeaf) {
      if (gl === undefined) {
        throw new Error(
          "program element is a program but context is undefined"
        );
      }

      // get the time uniform location
      if (this.programElement.totalNeeds.timeUniform) {
        gl.useProgram(this.programElement.program);
        const timeLoc = gl.getUniformLocation(
          this.programElement.program,
          "uTime"
        );
        if (timeLoc === null) {
          throw new Error("could not get the time uniform location");
        }
        this.timeLoc = timeLoc;
      }

      // get the mouse uniform location
      if (this.programElement.totalNeeds.mouseUniform) {
        gl.useProgram(this.programElement.program);
        const mouseLoc = gl.getUniformLocation(
          this.programElement.program,
          "uMouse"
        );
        if (mouseLoc === null) {
          throw new Error("could not get the mouse uniform location");
        }
        this.mouseLoc = mouseLoc;
      }
    }
  }

  /** get all needs from all programs */
  getTotalNeeds(): Needs {
    // go through needs of program loop
    if (!(this.programElement instanceof WebGLProgramLeaf)) {
      const allNeeds: Needs[] = [];
      for (const p of this.programElement) {
        allNeeds.push(p.getTotalNeeds());
      }
      return allNeeds.reduce(updateNeeds);
    }
    return this.programElement.totalNeeds;
  }

  /**
   * recursively uses all programs in the loop, binding the appropriate
   * textures and setting the appropriate uniforms; the user should only have
   * to call [[draw]] on [[Merger]] and never this function directly
   */
  run(
    gl: WebGL2RenderingContext,
    tex: TexInfo,
    framebuffer: WebGLFramebuffer,
    uniformLocs: UniformLocs,
    last: boolean,
    defaultUniforms: DefaultUniforms
  ) {
    for (let i = 0; i < this.loopInfo.num; i++) {
      const newLast = i === this.loopInfo.num - 1;
      if (this.programElement instanceof WebGLProgramLeaf) {
        // effects list is populated
        if (i === 0) {
          gl.useProgram(this.programElement.program);
          if (this.programElement.totalNeeds?.sceneBuffer) {
            if (tex.scene === undefined) {
              throw new Error(
                "needs scene buffer, but scene texture is somehow undefined"
              );
            }
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, tex.scene);
          }
          for (const effect of this.programElement.effects) {
            effect.applyUniforms(gl, uniformLocs);
          }

          // set time uniform if needed
          if (this.programElement.totalNeeds?.timeUniform) {
            if (
              this.timeLoc === undefined ||
              defaultUniforms.timeVal === undefined
            ) {
              throw new Error("time or location is undefined");
            }
            gl.uniform1f(this.timeLoc, defaultUniforms.timeVal);
          }

          // set mouse uniforms if needed
          if (this.programElement.totalNeeds?.mouseUniform) {
            if (
              this.mouseLoc === undefined ||
              defaultUniforms.mouseX === undefined ||
              defaultUniforms.mouseY === undefined
            ) {
              throw new Error("mouse uniform or location is undefined");
            }
            gl.uniform2f(
              this.mouseLoc,
              defaultUniforms.mouseX,
              defaultUniforms.mouseY
            );
          }
        }
        if (newLast && last && this.last) {
          // we are on the final pass of the final loop, so draw screen by
          // setting to the default framebuffer
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
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
        }
        // allows us to read from `texBack`
        // default sampler is 0, so `uSampler` uniform will always sample from texture 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex.back);
        [tex.back, tex.front] = [tex.front, tex.back];
        // use our last program as the draw program
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        if (this.loopInfo.func !== undefined) {
          this.loopInfo.func(i);
        }
        for (const p of this.programElement) {
          p.run(gl, tex, framebuffer, uniformLocs, newLast, defaultUniforms);
        }
      }
    }
  }

  delete(gl: WebGL2RenderingContext) {
    if (this.programElement instanceof WebGLProgramLeaf) {
      gl.deleteProgram(this.programElement);
    } else {
      for (const p of this.programElement) {
        p.delete(gl);
      }
    }
  }
}
