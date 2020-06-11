import {
  UniformVal,
  DefaultNameMap,
  NamedUniformVal,
  UniformValMap as UniformValChangeMap,
  RawVec,
  Effect,
  uniformGLSLTypeStr,
} from "../effect";

// TODO see if we need this later
export type FullExpr<T> = Expr<T> | T;

/** effects and expressions satisfy this */
export interface EffectLike {
  // TODO rename this
  uniforms: UniformValChangeMap;
  defaultNameMap: DefaultNameMap;
  externalFuncs: string[];
  // TODO include needs
}

interface UniformTypeMap {
  // TODO give a proper type that only denotes type names
  [name: string]: string;
}

/** info needed to generate proper declarations */
export interface BuildInfo {
  uniformTypes: UniformTypeMap;
  externalFuncs: Set<string>;
}

// TODO make this a member function of expression once effects are finished
/**
 * turn an expression (which can be a float or vec) into a string
 * @param val the expression that gets parsed
 * @param defaultName what to name it if it is unnamed uniform
 * @param e the expression or effect that gets added to
 * @param bi the top level effect to add uniforms and functions to
 */
export function parse(
  val: FullExpr<UniformVal>,
  defaultName: string,
  e: EffectLike,
  bi: BuildInfo
): string {
  if (val instanceof Expr) {
    return val.parse(bi);
  }
  // transform `DefaultUniformVal` to `NamedUniformVal`
  let defaulted = false;
  if (typeof val !== "number" && val.length === 1) {
    const namedVal = [defaultName, val[0]] as NamedUniformVal;
    val = namedVal;
    defaulted = true;
  }
  if (typeof val === "number") {
    // this is a float
    return toGLSLFloatString(val);
  }
  if (typeof val[0] === "string") {
    // this is a named value, so it should be inserted as a uniform
    const namedVal = val as NamedUniformVal;
    const name = namedVal[0];
    // TODO what else should it not include?
    if (!defaulted && name.includes("_id_")) {
      throw new Error("cannot set a named uniform that has _id_ in it");
    }
    if (/^i[0-9]+$/g.test(name)) {
      throw new Error(
        "cannot name a uniform that matches regex ^i[0-9]+$" +
          "since that's reserved for name of index" +
          "in for loops of generated code"
      );
    }
    const uniformVal = namedVal[1];
    // set to true so they are set to their default values on first draw
    e.uniforms[name] = { val: uniformVal, changed: true };
    // add the new type to the map
    bi.uniformTypes[name] = uniformGLSLTypeStr(uniformVal);
    // add each of the external funcs to the builder
    e.externalFuncs.forEach((func) => bi.externalFuncs.add(func));
    // add the name mapping
    e.defaultNameMap[defaultName] = name;
    return name;
  }
  // not a named value, so it can be inserted into code directly like a macro
  const uniformVal = val as RawVec;
  return `vec${uniformVal.length}(${uniformVal
    .map((n) => toGLSLFloatString(n))
    .join(", ")})`;
}

function toGLSLFloatString(num: number) {
  let str = "" + num;
  if (!str.includes(".")) str += ".";
  return str;
}

export abstract class Expr<T> implements EffectLike {
  static count = 0;
  idStr: string;
  uniforms: UniformValChangeMap = {};
  defaultNameMap: DefaultNameMap = {};
  externalFuncs: string[] = [];

  constructor() {
    // TODO make it so you can't have _ex_ in the name
    this.idStr = "_ex_" + Expr.count;
    Expr.count++;
  }

  /** converts expr to string, adding to effect dependencies */
  abstract parse(bi: BuildInfo): string;
}
