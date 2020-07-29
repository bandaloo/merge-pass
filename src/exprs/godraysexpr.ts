import { Float, Vec2, Vec4 } from "../exprtypes";
import { glslFuncs } from "../glslfunctions";
import {
  ExprVec4,
  float,
  mut,
  PrimitiveFloat,
  PrimitiveVec2,
  PrimitiveVec4,
  tag,
  wrapInValue,
} from "./expr";
import { fcolor } from "./fragcolorexpr";
import { pvec2, vec4 } from "./vecexprs";

/**
 * @ignore
 * the number of samples in the source code already
 */
const DEFAULT_SAMPLES = 100;

/** godrays expression */
export class GodRaysExpr extends ExprVec4 {
  col: Vec4;
  exposure: Float;
  decay: Float;
  density: Float;
  weight: Float;
  lightPos: Vec2;
  threshold?: Float;
  newColor?: Vec4;

  // sane godray defaults from https://github.com/Erkaman/glsl-godrays/blob/master/example/index.js
  constructor(
    col: Vec4 = fcolor(),
    exposure: Float = mut(1.0),
    decay: Float = mut(1.0),
    density: Float = mut(1.0),
    weight: Float = mut(0.01),
    lightPos: Vec2 = mut(pvec2(0.5, 0.5)),
    samplerNum: number = 0,
    numSamples: number = DEFAULT_SAMPLES,
    convertDepth?: { threshold: Float; newColor: Vec4 }
  ) {
    // TODO the metaprogramming here is not so good!
    // leaving off the function call section for now (we addd it back later)
    const sourceLists = tag`${col}, ${exposure}, ${decay}, ${density}, ${weight}, ${lightPos}, ${
      convertDepth !== undefined ? convertDepth.threshold : float(0)
    }, ${
      convertDepth !== undefined ? convertDepth.newColor : vec4(0, 0, 0, 0)
    })`;
    // TODO make this more generic
    // append the _<num> onto the function name
    // also add _depth if this is a version of the function that uses depth buffer
    const customName = `godrays${convertDepth !== undefined ? "_depth" : ""}${
      numSamples !== 100 ? "_s" + numSamples : ""
    }(`;
    sourceLists.sections[0] = customName;
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
    this.col = col;
    this.exposure = exposure;
    this.decay = decay;
    this.density = density;
    this.weight = weight;
    this.lightPos = lightPos;
    this.threshold = convertDepth?.threshold;
    this.newColor = convertDepth?.newColor;

    // will be 1 if needs to convert depth, and 0 otherwise
    this.funcIndex = ~~(convertDepth !== undefined);

    let customGodRayFunc = glslFuncs.godrays
      .split("godrays(")
      .join(customName)
      .replace(
        `NUM_SAMPLES = ${DEFAULT_SAMPLES}`,
        "NUM_SAMPLES = " + numSamples
      );

    if (convertDepth !== undefined) {
      // with regex, uncomment the line in the source code that does the
      // conversion (if you think about it that's basically what a preprocessor
      // does...)
      customGodRayFunc = customGodRayFunc.replace(/\/\/uncomment\s/g, "");
      this.externalFuncs.push(glslFuncs.depth2occlusion);
    }
    this.externalFuncs.push(customGodRayFunc);
    this.brandExprWithChannel(this.funcIndex, samplerNum);
  }

  /** sets the light color */
  setColor(color: PrimitiveVec4) {
    this.setUniform("uCol" + this.id, color);
    this.col = color;
  }

  /** sets the exposure */
  setExposure(exposure: PrimitiveFloat | number) {
    this.setUniform("uExposure" + this.id, exposure);
    this.exposure = wrapInValue(exposure);
  }

  /** sets the decay */
  setDecay(decay: PrimitiveFloat | number) {
    this.setUniform("uDecay" + this.id, decay);
    this.decay = wrapInValue(decay);
  }

  /** sets the density */
  setDensity(density: PrimitiveFloat | number) {
    this.setUniform("uDensity" + this.id, density);
    this.density = wrapInValue(density);
  }

  /** sets the weight */
  setWeight(weight: PrimitiveFloat | number) {
    this.setUniform("uWeight" + this.id, weight);
    this.weight = wrapInValue(weight);
  }

  /** sets the light position */
  setLightPos(lightPos: PrimitiveVec2) {
    this.setUniform("uLightPos" + this.id, lightPos);
    this.lightPos = lightPos;
  }

  // these only matter when you're using a depth buffer and not an occlusion
  // buffer (although right now, you'll still be able to set them)

  setThreshold(threshold: PrimitiveFloat | number) {
    this.setUniform("uThreshold" + this.id, threshold);
    this.threshold = wrapInValue(threshold);
  }

  setNewColor(newColor: PrimitiveVec4) {
    this.setUniform("uNewColor" + this.id, newColor);
    this.newColor = newColor;
  }
}

/** options that define how the godrays will look */
interface GodraysOptions {
  /** color of the light */
  color?: Vec4;
  /** multiplies final output */
  exposure?: Float | number;
  /** how much to decrease light for each sample */
  decay?: Float | number;
  /** how close samples are together */
  density?: Float | number;
  /** multiplies the original background colors */
  weight?: Float | number;
  /** where the rays eminate from */
  lightPos?: Vec2;
  /**
   * number of samples; aka the quality (note that this cannot be changed at
   * runtime, as looping by a non-constant does not play nice with shaders)
   */
  numSamples?: number;
  /** where to sample from */
  samplerNum?: number;
  /** information for how to convert a depth buffer into an occlusion buffer */
  convertDepth?: {
    /** what depth is unoccluded (assumes `1 / distance` depth buffer) */
    threshold: Float | number;
    /** what the unoccluded color should be */
    newColor: Vec4;
  };
}

/**
 * create a godrays expression which requires an occlusion map; all values are
 * mutable by default
 * @param options object that defines godrays properties (has sane defaults)
 */
export function godrays(options: GodraysOptions = {}) {
  return new GodRaysExpr(
    options.color,
    wrapInValue(options.exposure),
    wrapInValue(options.decay),
    wrapInValue(options.density),
    wrapInValue(options.weight),
    options.lightPos,
    options.samplerNum,
    options.numSamples,
    options.convertDepth === undefined
      ? undefined
      : {
          threshold: wrapInValue(options.convertDepth.threshold),
          newColor: options.convertDepth.newColor,
        }
  );
}
