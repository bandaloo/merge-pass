import { AllVals, Vec } from "../exprtypes";
import { Operator as Op, PrimitiveFloat, wrapInValue } from "./expr";
import { checkLegalComponents, typeStringToLength } from "./getcompexpr";

export type ArithOp = "/" | "*" | "+" | "-";

/** @ignore */
function getChangeFunc(
  typ: string,
  id: string,
  setter: AllVals,
  comps: string,
  op: ArithOp | "" = ""
) {
  return `${typ} changecomp_${id}(${typ} col, ${setter.typeString()} setter) {
  col.${comps} ${op}= setter;
  return col;
}`;
}

/**
 * throws a runtime error if component access is not valid, and disallows
 * duplicate components because duplicate components can not be in a left
 * expression. (for example `v.xyx = vec3(1., 2., 3.)` is illegal, but `v1.xyz
 * = v2.xyx` is legal.) also checks for type errors such as `v1.xy = vec3(1.,
 * 2., 3.)`; the right hand side can only be a `vec2` if only two components
 * are supplied
 * @param comps component string
 * @param setter how the components are being changed
 * @param vec the vector where components are being accessed
 */
function checkChangeComponents(comps: string, setter: AllVals, vec: Vec) {
  // setter has different length than components
  if (comps.length !== typeStringToLength(setter.typeString())) {
    throw new Error("components length must be equal to the target float/vec");
  }
  // duplicate components
  if (duplicateComponents(comps)) {
    throw new Error("duplicate components not allowed on left side");
  }
  // legal components
  checkLegalComponents(comps, vec);
}

/** @ignore */
function duplicateComponents(comps: string) {
  return new Set(comps.split("")).size !== comps.length;
}

/** change component expression */
export class ChangeCompExpr<T extends Vec, U extends AllVals> extends Op<T> {
  originalVec: T;
  newVal: U;

  constructor(vec: T, setter: U, comps: string, op?: ArithOp) {
    checkChangeComponents(comps, setter, vec);
    // part of name of custom function
    const operation =
      op === "+"
        ? "plus"
        : op === "-"
        ? "minus"
        : op === "*"
        ? "mult"
        : op === "/"
        ? "div"
        : "assign";
    const suffix = `${vec.typeString()}_${setter.typeString()}_${comps}_${operation}`;
    super(
      vec,
      { sections: [`changecomp_${suffix}(`, ", ", ")"], values: [vec, setter] },
      ["uOriginal", "uNew"]
    );
    this.originalVec = vec;
    this.newVal = setter;
    this.externalFuncs = [
      getChangeFunc(vec.typeString(), suffix, setter, comps, op),
    ];
  }

  /** set the original vector */
  setOriginal(originalVec: T) {
    this.setUniform("uOriginal" + this.id, originalVec);
    this.originalVec = originalVec;
  }

  /** set the neww vector */
  setNew(newVal: U | number) {
    this.setUniform("uNew" + this.id, newVal);
    this.newVal = wrapInValue(newVal) as U;
  }
}

export function changecomp<T extends Vec>(
  vec: T,
  setter: number,
  comps: string,
  op?: ArithOp
): ChangeCompExpr<T, PrimitiveFloat>;

export function changecomp<T extends Vec, U extends AllVals>(
  vec: T,
  setter: U,
  comps: string,
  op?: ArithOp
): ChangeCompExpr<T, U>;

/**
 * change the components of a vector
 * @param vec the vector to augment components of
 * @param setter the vector (or float, if only one component is changed) for
 * how to change the components
 * @param comps string representing the components to change (e.g. `"xy"` or
 * `"r"` or `"stpq"`.)
 * @param op optionally perform an operation on the original component
 * (defaults to no operation, just assigning that component to a new value)
 */
export function changecomp(vec: any, setter: any, comps: string, op?: ArithOp) {
  return new ChangeCompExpr(vec, wrapInValue(setter), comps, op);
}
