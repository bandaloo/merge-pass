import { Expr, Needs } from "./exprs/expr";
import { LoopInfo, TexInfo, UniformLocs } from "./mergepass";

export type WebGLProgramElement = WebGLProgram | WebGLProgramLoop[];

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
  timeVal: number;
  mouseX: number;
  mouseY: number;
}

/** recursive data structure of compiled programs */
export class WebGLProgramLoop {
  programElement: WebGLProgramElement;
  repeat: LoopInfo;
  effects: Expr[];
  last = false;
  totalNeeds: Needs | undefined;
  timeLoc?: WebGLUniformLocation;
  mouseLoc?: WebGLUniformLocation;

  constructor(
    programElement: WebGLProgramElement,
    repeat: LoopInfo,
    gl: WebGL2RenderingContext,
    totalNeeds?: Needs, // only defined when leaf
    effects: Expr[] = [] // only populated when leaf
  ) {
    this.programElement = programElement;
    this.repeat = repeat;
    this.totalNeeds = totalNeeds;
    this.effects = effects;
    if (programElement instanceof WebGLProgram) {
      if (gl === undefined) {
        throw new Error(
          "program element is a program but context is undefined"
        );
      }

      // get the time uniform location
      if (this.totalNeeds?.timeUniform) {
        gl.useProgram(programElement);
        const timeLoc = gl.getUniformLocation(programElement, "uTime");
        if (timeLoc === null) {
          throw new Error("could not get the time uniform location");
        }
        this.timeLoc = timeLoc;
      }

      // get the mouse uniform location
      if (this.totalNeeds?.mouseUniform) {
        gl.useProgram(programElement);
        const mouseLoc = gl.getUniformLocation(programElement, "uMouse");
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
    if (!(this.programElement instanceof WebGLProgram)) {
      const allNeeds: Needs[] = [];
      for (const p of this.programElement) {
        allNeeds.push(p.getTotalNeeds());
      }
      // update me on change to needs
      return allNeeds.reduce(updateNeeds);
    }
    if (this.totalNeeds === undefined) {
      throw new Error("total needs of webgl program was somehow undefined");
    }
    return this.totalNeeds;
  }

  /**
   * recursively uses all programs in the loop, binding the appropriate
   * textures and setting the appropriate uniforms; the user should only have
   * to call [[draw]] on [[Merger]]
   */
  run(
    gl: WebGL2RenderingContext,
    tex: TexInfo,
    framebuffer: WebGLFramebuffer,
    uniformLocs: UniformLocs,
    last: boolean,
    defaultUniforms: DefaultUniforms
  ) {
    for (let i = 0; i < this.repeat.num; i++) {
      const newLast = i === this.repeat.num - 1;
      if (this.programElement instanceof WebGLProgram) {
        // effects list is populated
        if (i === 0) {
          gl.useProgram(this.programElement);
          if (this.totalNeeds?.sceneBuffer) {
            if (tex.scene === undefined) {
              throw new Error(
                "needs scene buffer, but scene texture is somehow undefined"
              );
            }
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, tex.scene);
          }
          for (const effect of this.effects) {
            effect.applyUniforms(gl, uniformLocs);
          }

          // set time uniform if needed
          if (this.totalNeeds?.timeUniform) {
            if (
              this.timeLoc === undefined ||
              defaultUniforms.timeVal === undefined
            ) {
              throw new Error("time or location is undefined");
            }
            gl.uniform1f(this.timeLoc, defaultUniforms.timeVal);
          }

          // set mouse uniforms if needed
          if (this.totalNeeds?.mouseUniform) {
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
        if (this.repeat.func !== undefined) {
          this.repeat.func(i);
        }
        for (const p of this.programElement) {
          p.run(gl, tex, framebuffer, uniformLocs, newLast, defaultUniforms);
        }
      }
    }
  }
}
