import { Expr, Needs } from "./exprs/expr";
import { LoopInfo, TexInfo, UniformLocs, TexWrapper } from "./mergepass";
import { settings } from "./settings";

export type WebGLProgramElement = WebGLProgramLeaf | WebGLProgramLoop[];

// update me on change to needs
export function updateNeeds(acc: Needs, curr: Needs): Needs {
  return {
    neighborSample: acc.neighborSample || curr.neighborSample,
    centerSample: acc.centerSample || curr.centerSample,
    sceneBuffer: acc.sceneBuffer || curr.sceneBuffer,
    timeUniform: acc.timeUniform || curr.timeUniform,
    mouseUniform: acc.mouseUniform || curr.mouseUniform,
    passCount: acc.passCount || curr.passCount,
    extraBuffers: new Set([...acc.extraBuffers, ...curr.extraBuffers]),
  };
}

/** values to set the default uniforms `uTime` and `uMouse` to */
interface DefaultUniforms {
  /** `uTime` uniform value */
  timeVal: number;
  /** x component of `uMouse` uniform */
  mouseX: number;
  /** y component of `uMouse` uniform */
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

/** @ignore */
function getLoc(
  programElement: WebGLProgramLeaf,
  gl: WebGL2RenderingContext,
  name: string
) {
  gl.useProgram(programElement.program);
  const loc = gl.getUniformLocation(programElement.program, name);
  if (loc === null) {
    throw new Error("could not get the " + name + " uniform location");
  }
  return loc;
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
  countLoc?: WebGLUniformLocation;

  counter = 0;

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

      if (this.programElement.totalNeeds.timeUniform) {
        this.timeLoc = getLoc(this.programElement, gl, "uTime");
      }
      if (this.programElement.totalNeeds.mouseUniform) {
        this.mouseLoc = getLoc(this.programElement, gl, "uMouse");
      }
      if (this.programElement.totalNeeds.passCount) {
        this.countLoc = getLoc(this.programElement, gl, "uCount");
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
    defaultUniforms: DefaultUniforms,
    outerLoop?: WebGLProgramLoop
  ) {
    let savedTexture: TexWrapper | undefined;
    if (
      this.loopInfo.target !== undefined &&
      // if there is a target switch:
      outerLoop?.loopInfo.target !== this.loopInfo.target
    ) {
      // swap out the back texture for the channel texture if this loop has
      // an alternate render target
      savedTexture = tex.back;
      if (this.loopInfo.target !== -1) {
        tex.back = tex.bufTextures[this.loopInfo.target];
      } else {
        if (tex.scene === undefined) {
          throw new Error("tried to target -1 but scene texture was undefined");
        }
        tex.back = tex.scene;
      }
      tex.bufTextures[this.loopInfo.target] = savedTexture;
      if (settings.verbosity > 99)
        console.log("saved texture: " + savedTexture.name);
    }

    // setup for program leaf
    if (this.programElement instanceof WebGLProgramLeaf) {
      // bind the scene texture if needed
      if (this.programElement.totalNeeds.sceneBuffer) {
        if (tex.scene === undefined) {
          throw new Error(
            "needs scene buffer, but scene texture is somehow undefined"
          );
        }
        gl.activeTexture(gl.TEXTURE1 + settings.offset);
        if (this.loopInfo.target === -1) {
          gl.bindTexture(gl.TEXTURE_2D, (savedTexture as TexWrapper).tex);
        } else {
          gl.bindTexture(gl.TEXTURE_2D, tex.scene.tex);
        }
      }

      // bind all extra channel textures if needed
      for (const n of this.programElement.totalNeeds.extraBuffers) {
        gl.activeTexture(gl.TEXTURE2 + n + settings.offset);
        gl.bindTexture(gl.TEXTURE_2D, tex.bufTextures[n].tex);
      }

      // use the current program
      gl.useProgram(this.programElement.program);

      // apply all uniforms
      for (const effect of this.programElement.effects) {
        effect.applyUniforms(gl, uniformLocs);
      }

      // set time uniform if needed
      if (this.programElement.totalNeeds.timeUniform) {
        if (
          this.timeLoc === undefined ||
          defaultUniforms.timeVal === undefined
        ) {
          throw new Error("time or location is undefined");
        }
        gl.uniform1f(this.timeLoc, defaultUniforms.timeVal);
      }

      // set mouse uniforms if needed
      if (this.programElement.totalNeeds.mouseUniform) {
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

      // set count uniform if needed
      if (this.programElement.totalNeeds.passCount && outerLoop !== undefined) {
        if (this.countLoc === undefined) {
          throw new Error("count location is undefined");
        }
        if (outerLoop !== undefined) {
          gl.uniform1i(this.countLoc, outerLoop.counter);
        }
        this.counter++;
        const mod = outerLoop === undefined ? 1 : outerLoop.loopInfo.num;
        this.counter %= mod;
      }
    }

    for (let i = 0; i < this.loopInfo.num; i++) {
      const newLast = i === this.loopInfo.num - 1;
      if (this.programElement instanceof WebGLProgramLeaf) {
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
            tex.front.tex,
            0
          );
        }
        // allows us to read from `texBack`
        // default sampler is 0, so `uSampler` uniform will always sample from texture 0
        gl.activeTexture(gl.TEXTURE0 + settings.offset);
        gl.bindTexture(gl.TEXTURE_2D, tex.back.tex);
        // use our last program as the draw program
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (settings.verbosity > 99) {
          console.log("intermediate back", tex.back.name);
          console.log("intermediate front", tex.front.name);
        }

        // swap back and front
        [tex.back, tex.front] = [tex.front, tex.back];

        // deactivate and unbind all the channel textures needed
        for (const n of this.programElement.totalNeeds.extraBuffers) {
          gl.activeTexture(gl.TEXTURE2 + n + settings.offset);
          gl.bindTexture(gl.TEXTURE_2D, null);
        }

        gl.activeTexture(gl.TEXTURE1 + settings.offset);
        gl.bindTexture(gl.TEXTURE_2D, null);
      } else {
        if (this.loopInfo.func !== undefined) {
          this.loopInfo.func(i);
        }
        for (const p of this.programElement) {
          p.run(
            gl,
            tex,
            framebuffer,
            uniformLocs,
            newLast,
            defaultUniforms,
            this // this is now the outer loop
          );
        }
      }
    }

    // swap the textures back if we were temporarily using a channel texture
    if (savedTexture !== undefined) {
      const target = this.loopInfo.target as number;

      if (settings.verbosity > 99) {
        console.log("pre final back", tex.back.name);
        console.log("pre final front", tex.front.name);
      }

      // back texture is really the front texture because it was just swapped
      if (this.loopInfo.target !== -1) {
        tex.bufTextures[target] = tex.back;
      } else {
        if (tex.scene === undefined) {
          throw new Error(
            "tried to replace -1 but scene texture was undefined"
          );
        }
        tex.scene = tex.back;
      }
      tex.back = savedTexture;

      if (settings.verbosity > 99) {
        console.log("post final back", tex.back.name);
        console.log("post final front", tex.front.name);
        console.log("channel texture", tex.bufTextures[target].name);
      }
    }
  }

  delete(gl: WebGL2RenderingContext) {
    if (this.programElement instanceof WebGLProgramLeaf) {
      gl.deleteProgram(this.programElement.program);
    } else {
      for (const p of this.programElement) {
        p.delete(gl);
      }
    }
  }
}
