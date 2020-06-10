import {
  UniformVal,
  DefaultNameMap,
  NamedUniformVal,
  UniformValMap,
  RawVec,
} from "../effect";

// TODO see if we need this later
export type FullExpr<T> = Expr<T> | T;

/** effects and expressions satisfy this */
interface EffectLike {
  uniforms: UniformValMap;
  defaultNameMap: DefaultNameMap;
}

// TODO find a better spot for this
/**
 * turn an expression (which can be a float or vec) into a string
 * @param val the expression that gets parsed
 * @param defaultName what to name it if it is unnamed uniform
 * @param e the expression or effect that gets added to
 */
export function parse(
  val: FullExpr<UniformVal>,
  defaultName: string,
  e: EffectLike // basically a stand-in for this
): string {
  if (val instanceof Expr) {
    return val.parse();
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
    val;
    return toGLSLFloatString(val);
  }
  if (typeof val[0] === "string") {
    // this is a named value, so it should be inserted as a uniform
    const namedVal = val as NamedUniformVal;
    const name = namedVal[0];
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
    e.uniforms[name] = { val: uniformVal, changed: true };
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
  uniforms: UniformValMap = {};
  defaultNameMap: DefaultNameMap = {};
  /** converts expr to string, adding to effect dependencies */
  abstract parse(): string;
}
