import { Needs, SourceLists, Expr } from "./exprs/expr";
import { Float } from "./exprtypes";
import { glslFuncs } from "./glslfunctions";

/** @ignore */
export function captureAndAppend(str: string, reg: RegExp, suffix: string) {
  const matches = str.match(reg);
  if (matches === null) throw new Error("no match in the given string");
  return str.replace(reg, matches[0] + suffix);
}

/** @ignore */
function nameExtractor(sourceLists: SourceLists, extra: string) {
  const origFuncName = sourceLists.sections[0];
  const ending = origFuncName[origFuncName.length - 1] === ")" ? ")" : "";
  const newFuncName =
    origFuncName.substr(0, origFuncName.length - 1 - ~~(ending === ")")) +
    extra +
    "(" +
    ending;
  return { origFuncName, newFuncName, ending };
}

/** @ignore */
export function brandWithChannel(
  sourceLists: SourceLists,
  funcs: string[],
  needs: Needs,
  funcIndex: number,
  samplerNum?: number
) {
  samplerNum === undefined || samplerNum === -1
    ? (needs.neighborSample = true)
    : (needs.extraBuffers = new Set([samplerNum]));
  if (samplerNum === undefined || samplerNum === -1) return;
  const { origFuncName, newFuncName, ending } = nameExtractor(
    sourceLists,
    samplerNum !== undefined ? "_" + samplerNum : ""
  );

  sourceLists.sections[0] = sourceLists.sections[0]
    .split(origFuncName)
    .join(newFuncName);
  funcs[funcIndex] = funcs[funcIndex]
    .split(origFuncName)
    .join(newFuncName)
    .split("uSampler")
    .join("uBufferSampler" + samplerNum);
}

/** @ignore */
export function brandWithRegion(
  expr: Expr,
  funcIndex: number,
  space: Float[] | Float
) {
  // if it's not a rectangle region we can't do anything so just return
  if (!Array.isArray(space)) return;
  const sourceLists = expr.sourceLists;
  const funcs = expr.externalFuncs;
  const needs = expr.needs;
  if (
    expr.regionBranded ||
    (!needs.neighborSample && needs.extraBuffers.size === 0)
  )
    return;
  const { origFuncName, newFuncName, ending } = nameExtractor(
    sourceLists,
    "_region"
  );
  const openFuncName = newFuncName.substr(
    0,
    newFuncName.length - ~~(ending === ")")
  );
  const newFuncDeclaration =
    openFuncName +
    "float r_x_min, float r_y_min, float r_x_max, float r_y_max" +
    (ending === ")" ? ")" : ", ");

  const origTextureName = "texture2D(";
  const newTextureName =
    "texture2D_region(r_x_min, r_y_min, r_x_max, r_y_max, ";

  // replace name in the external function and `texture2D` and sampler
  // (assumes the sampling function is the first external function)
  funcs[funcIndex] = funcs[funcIndex]
    .split(origFuncName)
    .join(newFuncDeclaration)
    .split(origTextureName)
    .join(newTextureName);

  // shift the original name off the list
  sourceLists.sections.shift();
  // add the close paren if we're opening up a function with 0 args
  if (ending === ")") sourceLists.sections.unshift(")");
  // add commas (one less if it is a 0 arg function call)
  for (let i = 0; i < 4 - ~~(ending === ")"); i++) {
    sourceLists.sections.unshift(", ");
  }

  // add the new name to the beginning of the list
  sourceLists.sections.unshift(
    newFuncName.substr(0, newFuncName.length - ~~(ending === ")"))
  );
  // add values from region data
  sourceLists.values.unshift(...space);

  // put the texture access wrapper at the beginning
  funcs.unshift(glslFuncs.texture2D_region);
  expr.regionBranded = true;
}
