import { ExprVec4, tag, n2e, float } from "./expr";
import { fcolor } from "./fragcolorexpr";
import { glslFuncs, replaceSampler } from "../glslfunctions";
import { Float, Vec4, Vec2 } from "../exprtypes";
import { vec2, vec4 } from "./vecexprs";

export class GodRaysExpr extends ExprVec4 {
  constructor(
    col: Vec4,
    exposure: Float,
    decay: Float,
    density: Float,
    weight: Float,
    lightPos: Vec2,
    samplerNum: number,
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
    console.log(sourceLists);
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
    this.setUniform("uExposure" + this.id, n2e(exposure));
  }

  setDecay(decay: Float | number) {
    this.setUniform("uDecay" + this.id, n2e(decay));
  }

  setDensity(density: Float | number) {
    this.setUniform("uDensity" + this.id, n2e(density));
  }

  setWeight(weight: Float | number) {
    this.setUniform("uWeight" + this.id, n2e(weight));
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

// sane godray defaults from https://github.com/Erkaman/glsl-godrays/blob/master/example/index.js
export function godrays(
  col: Vec4 = fcolor(),
  exposure: Float | number = 1.0,
  decay: Float | number = 1.0,
  density: Float | number = 1.0,
  weight: Float | number = 0.01,
  lightPos: Vec2 = vec2(0.5, 0.5),
  samplerNum: number = 0,
  convertDepth?: { threshold: Float | number; newColor: Vec4 }
) {
  return new GodRaysExpr(
    col,
    n2e(exposure),
    n2e(decay),
    n2e(density),
    n2e(weight),
    lightPos,
    samplerNum,
    convertDepth === undefined
      ? undefined
      : {
          threshold: n2e(convertDepth.threshold),
          newColor: convertDepth.newColor,
        }
  );
}
