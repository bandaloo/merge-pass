import { ExprVec4, Expr, Needs } from "./expressions/expr";
import { LoopInfo, TexInfo, UniformLocs, getNeedsOfList } from "./mergepass";

export type WebGLProgramElement = WebGLProgram | WebGLProgramLoop[];

export class WebGLProgramLoop {
  programElement: WebGLProgramElement;
  repeat: LoopInfo;
  effects: Expr[];
  last = false;
  totalNeeds: Needs | undefined;
  timeLoc?: WebGLUniformLocation;

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
      if (this.totalNeeds?.timeUniform) {
        gl.useProgram(programElement);
        const timeLoc = gl.getUniformLocation(programElement, "uTime");
        if (timeLoc === null) {
          throw new Error("could not get the time uniform location");
        }
        this.timeLoc = timeLoc;
      }
    }
  }

  getTotalNeeds(): Needs {
    // go through needs of program loop
    if (!(this.programElement instanceof WebGLProgram)) {
      const allNeeds: Needs[] = [];
      for (const p of this.programElement) {
        allNeeds.push(p.getTotalNeeds());
      }
      // update me on change to needs
      return allNeeds.reduce((acc, curr) => {
        return {
          neighborSample: acc.neighborSample || curr.neighborSample,
          centerSample: acc.centerSample || curr.centerSample,
          sceneBuffer: acc.sceneBuffer || curr.sceneBuffer,
          timeUniform: acc.timeUniform || curr.timeUniform,
        };
      });
    }
    if (this.totalNeeds === undefined) {
      throw new Error("total needs of webgl program was somehow undefined");
    }
    return this.totalNeeds;
  }

  draw(
    gl: WebGL2RenderingContext,
    tex: TexInfo,
    framebuffer: WebGLFramebuffer,
    uniformLocs: UniformLocs,
    last: boolean,
    time: number
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
          if (this.totalNeeds?.timeUniform) {
            if (this.timeLoc === undefined || time === undefined) {
              throw new Error("time or location is undefined");
            }
            gl.uniform1f(this.timeLoc, time);
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
        // go back to the default framebuffer object
        // use our last program as the draw program
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        if (this.repeat.func !== undefined) {
          this.repeat.func(i);
        }
        for (const p of this.programElement) {
          p.draw(gl, tex, framebuffer, uniformLocs, newLast, time);
        }
      }
    }
  }
}
