import { Vec4 } from "./exprtypes";
import { Expr } from "./effects/expression";
import { LoopInfo, UniformLocs } from "./mergepass";

export type WebGLProgramElement = WebGLProgram | WebGLProgramLoop[];

export class WebGLProgramLoop {
  program: WebGLProgramElement;
  repeat: LoopInfo;
  effects: Expr<Vec4>[];
  last = false;

  constructor(
    program: WebGLProgramElement,
    repeat: LoopInfo,
    effects: Expr<Vec4>[] = []
  ) {
    this.program = program;
    this.repeat = repeat;
    this.effects = effects;
  }

  draw(
    gl: WebGL2RenderingContext,
    tex: {
      front: WebGLTexture;
      back: WebGLTexture;
    },
    framebuffer: WebGLFramebuffer,
    uniformLocs: UniformLocs,
    last: boolean
  ) {
    let used = false;
    for (let i = 0; i < this.repeat.num; i++) {
      const newLast = i === this.repeat.num - 1;
      if (this.program instanceof WebGLProgram) {
        // TODO figure out way to move this from loop
        if (!used) {
          gl.useProgram(this.program);
          used = true;
        }
        // effects list is populated
        if (i === 0) {
          for (const effect of this.effects) {
            effect.applyUniforms(gl, uniformLocs);
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
          // swap the textures
          //console.log("swapping textures");
          //gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        // allows us to read from `texBack`
        // default sampler is 0, so `uSampler` uniform will always sample from texture 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex.back);
        [tex.back, tex.front] = [tex.front, tex.back];
        // go back to the default framebuffer object
        // TODO can we remove this?
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // use our last program as the draw program
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        if (this.repeat.func !== undefined) {
          this.repeat.func(i);
        }
        for (const p of this.program) {
          p.draw(gl, tex, framebuffer, uniformLocs, newLast);
        }
      }
    }
  }
}
