import { Float, Vec2, Vec4 } from "../exprtypes";
import { glslFuncs, replaceSampler } from "../glslfunctions";
import { ExprVec4, float, mut, n2e, tag } from "./expr";
import { fcolor } from "./fragcolorexpr";
import { pvec2, vec4 } from "./vecexprs";

export class GodRaysExpr extends ExprVec4 {
  constructor(
    col: Vec4 = fcolor(),
    exposure: Float = mut(1.0),
    decay: Float = mut(1.0),
    density: Float = mut(1.0),
    weight: Float = mut(0.01),
    lightPos: Vec2 = mut(pvec2(0.5, 0.5)),
    samplerNum: number = 0,
    convertDepth?: { threshold: Float; newColor: Vec4 }
  ) {
    // TODO the metaprogramming here is not so good!
    // leaving off the function call section for now
    const sourceLists = tag`${col}, ${exposure}, ${decay}, ${density}, ${weight}, ${lightPos}, ${
      convertDepth !== undefined ? convertDepth.threshold : float(0)
    }, ${
      convertDepth !== undefined ? convertDepth.newColor : vec4(0, 0, 0, 0)
    })`;
    // append the _<num> onto the function name
    // also add _depth if this is a version of the function that uses depth buffer
    sourceLists.sections[0] += `godrays_${samplerNum}${
      convertDepth !== undefined ? "_depth" : ""
    }(`;
    super(sourceLists, [
      "uCol",
      "uExposure",
      "uDecay",
      "uDensity",
      "uWeight",
      "uLightPos",
      "uThreshold",
      "uNewColor",
    ]);
    let customGodRayFunc = replaceSampler(
      glslFuncs.godrays,
      /vec4\sgodrays/g,
      samplerNum,
      convertDepth === undefined ? undefined : "_depth"
    );
    if (convertDepth !== undefined) {
      // uncomment the line that does the conversion
      customGodRayFunc = customGodRayFunc.replace(/\/\/uncomment\s/g, "");
      this.externalFuncs.push(glslFuncs.depth2occlusion);
    }
    this.externalFuncs.push(customGodRayFunc);
    this.needs.extraBuffers = new Set([0]);
  }

  setColor(color: Vec4) {
    this.setUniform("uCol" + this.id, color);
  }

  setExposure(exposure: Float | number) {
    this.setUniform("uExposure" + this.id, exposure);
  }

  setDecay(decay: Float | number) {
    this.setUniform("uDecay" + this.id, decay);
  }

  setDensity(density: Float | number) {
    this.setUniform("uDensity" + this.id, density);
  }

  setWeight(weight: Float | number) {
    this.setUniform("uWeight" + this.id, weight);
  }

  setLightPos(lightPos: Vec2) {
    this.setUniform("uLightPos" + this.id, lightPos);
  }

  // these only matter when you're using a depth buffer and not an occlusion
  // buffer (although right now, you'll still be able to set them)

  setThreshold(threshold: Float) {
    this.setUniform("uThreshold" + this.id, threshold);
  }

  setNewcolor(newColor: Vec4) {
    this.setUniform("uNewColor" + this.id, newColor);
  }
}

interface GodraysOptions {
  color?: Vec4;
  exposure?: Float | number;
  decay?: Float | number;
  density?: Float | number;
  weight?: Float | number;
  lightPos?: Vec2;
  samplerNum?: number;
  convertDepth?: { threshold: Float | number; newColor: Vec4 };
}

// sane godray defaults from https://github.com/Erkaman/glsl-godrays/blob/master/example/index.js
export function godrays(options: GodraysOptions = {}) {
  return new GodRaysExpr(
    options.color,
    n2e(options.exposure),
    n2e(options.decay),
    n2e(options.density),
    n2e(options.weight),
    options.lightPos,
    options.samplerNum,
    options.convertDepth === undefined
      ? undefined
      : {
          threshold: n2e(options.convertDepth.threshold),
          newColor: options.convertDepth.newColor,
        }
  );
}
