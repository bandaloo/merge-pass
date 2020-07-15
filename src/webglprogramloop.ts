import { Expr, Needs } from "./exprs/expr";
import { LoopInfo, TexInfo, UniformLocs, TexWrapper } from "./mergepass";

export type WebGLProgramElement = WebGLProgramLeaf | WebGLProgramLoop[];

let textureDebug = false;

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
    defaultUniforms: DefaultUniforms,
    outerLoop?: WebGLProgramLoop
  ) {
    let savedTexture: TexWrapper | undefined;
    // TODO get rid of this
    //console.log(outerLoop);
    //console.log(this.loopInfo.target === outerLoop?.loopInfo.target);
    /*
    console.log(
      "outer",
      outerLoop?.loopInfo.target,
      "inner",
      this.loopInfo.target
    );
    */
    if (
      this.loopInfo.target !== undefined &&
      // if there is a target switch:
      outerLoop?.loopInfo.target !== this.loopInfo.target
      //true
    ) {
      // swap out the back texture for the channel texture if this loop has
      // an alternate render target
      savedTexture = tex.back;
      tex.back = tex.bufTextures[this.loopInfo.target];
      if (textureDebug) console.log("saved texture: " + savedTexture.name);
    }
    // TODO get rid of this
    if (
      this.loopInfo.target !== undefined &&
      // if there is not a target switch:
      outerLoop?.loopInfo.target === this.loopInfo.target
    ) {
      //console.log("has target but not switching");
    }
    // activate and bind all the channel textures needed

    if (this.programElement instanceof WebGLProgramLeaf) {
      // TODO move this up
      gl.useProgram(this.programElement.program);
      if (this.programElement.totalNeeds.sceneBuffer) {
        if (tex.scene === undefined) {
          throw new Error(
            "needs scene buffer, but scene texture is somehow undefined"
          );
        }
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tex.scene.tex);
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
      for (const n of this.programElement.totalNeeds.extraBuffers) {
        gl.activeTexture(gl.TEXTURE2 + n);
        gl.bindTexture(gl.TEXTURE_2D, tex.bufTextures[n].tex);
      }
    }

    for (let i = 0; i < this.loopInfo.num; i++) {
      const newLast = i === this.loopInfo.num - 1;
      if (this.programElement instanceof WebGLProgramLeaf) {
        if (i === 0) {
          // TODO get rid of this
        }
        if (newLast && last && this.last) {
          // we are on the final pass of the final loop, so draw screen by
          // setting to the default framebuffer
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          // TODO get rid of this
          //console.log("rendering to the screen");
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
        // TODO bind to the channel texture instead, if the loop has a target
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex.back.tex);
        // use our last program as the draw program
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // TODO do we want to swap if a channel target was used?
        // TODO get rid of this
        if (textureDebug) {
          console.log("intermediate back", tex.back.name);
          console.log("intermediate front", tex.front.name);
        }
        // swap back and front
        [tex.back, tex.front] = [tex.front, tex.back];

        // deactivate and bind all the channel textures needed
        for (const n of this.programElement.totalNeeds.extraBuffers) {
          //console.log(n);
          gl.activeTexture(gl.TEXTURE2 + n);
          gl.bindTexture(gl.TEXTURE_2D, null);
        }
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
      //console.log('test')
      //[tex.front, savedTexture] = [savedTexture, tex.front];
      //const tempTexture = tex.back;
      //tex.back = savedTexture;
      // target can't be undefined if texture was saved so cast is ok
      //tex.bufTextures[this.loopInfo.target as number] = tempTexture;

      // swap back
      //console.log("rotating");
      const target = this.loopInfo.target as number;

      /*
      // rotate textures
      const tempFront = tex.front;
      // move back to front
      tex.front = tex.back;
      // move front to channel buffer
      tex.bufTextures[target] = tempFront;
      // make the back the saved texture
      tex.back = savedTexture;
      //[tex.back, tex.front] = [tex.front, tex.back];
      */
      // TODO get rid of this
      if (textureDebug) {
        console.log("pre final back", tex.back.name);
        console.log("pre final front", tex.front.name);
      }
      tex.bufTextures[target] = tex.front;
      tex.front = savedTexture;
      //[tex.back, tex.front] = [tex.front, tex.back];
      if (textureDebug) {
        console.log("post final back", tex.back.name);
        console.log("post final front", tex.front.name);
        console.log("channel texture", tex.bufTextures[target].name);
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
