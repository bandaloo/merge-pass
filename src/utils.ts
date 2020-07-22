import { SourceLists, Expr } from "./exprs/expr";
import { Float } from "./exprtypes";
import { glslFuncs } from "./glslfunctions";

/** @ignore */
export function captureAndAppend(str: string, reg: RegExp, suffix: string) {
  const matches = str.match(reg);
  if (matches === null) throw new Error("no match in the given string");
  return str.replace(reg, matches[0] + suffix);
}

// TODO get rid of this
/** @ignore */
export function replaceSampler(
  fullString: string,
  funcRegExp: RegExp,
  samplerNum: number,
  extra?: string // TODO see if this is even useful anymore
) {
  return captureAndAppend(
    fullString.replace(/uSampler/g, "uBufferSampler" + samplerNum),
    funcRegExp,
    "_" + samplerNum + (extra === undefined ? "" : extra)
  );
}

/** @ignore */
export function brandWithChannel(
  sourceLists: SourceLists,
  funcs: string[],
  samplerNum?: number
) {
  if (samplerNum === undefined) return;
  const origFuncName = sourceLists.sections[0];
  const newFuncName =
    origFuncName.substr(0, origFuncName.length - 1) +
    (samplerNum !== undefined ? "_" + samplerNum : "") +
    "(";

  // TODO get rid of this
  console.log(origFuncName);
  console.log(newFuncName);
  funcs[0] = funcs[0].split(origFuncName).join(newFuncName);
}

/** @ignore */
export function brandWithRegion(
  sourceLists: SourceLists,
  funcs: string[],
  space: Float[]
) {
  // TODO only do if it's a sampling expression
  const origFuncName = sourceLists.sections[0];
  const newFuncName =
    origFuncName.substr(0, origFuncName.length - 1) +
    (space !== undefined ? "_region" : "") +
    "(";
  const newFuncDeclaration =
    newFuncName +
    "float r_x_min, float r_y_min, float r_x_max, float r_y_max, ";

  const origTextureName = "texture2D(";
  const newTextureName =
    "texture2D_region(r_x_min, r_y_min, r_x_max, r_y_max, ";

  //const origSamplerName = "uSampler";
  //const newSamplerName = "uBufferSamper";

  // replace name in the external function and `texture2D` and sampler
  // (assumes the sampling function is the first external function)
  funcs[0] = funcs[0]
    .split(origFuncName)
    .join(newFuncDeclaration)
    .split(origTextureName)
    .join(newTextureName);
  //.split(origSamplerName)
  //.join(newSamplerName);

  if (space !== undefined) {
    // shift the original name off the list
    sourceLists.sections.shift();
    for (let i = 0; i < 4; i++) {
      sourceLists.sections.unshift(", ");
    }
    // add the new name to the beginning of the list
    sourceLists.sections.unshift(newFuncName);
    // add values from region data
    sourceLists.values.unshift(...space);
  }
  funcs.unshift(glslFuncs.texture2D_region);
  // TODO get rid of this
  console.log(sourceLists);
}
