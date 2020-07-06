import { AllVals, Vec } from "../exprtypes";
import { Operator as Op, PrimitiveFloat, wrapInValue, n2e } from "./expr";
import { checkLegalComponents, typeStringToLength } from "./getcompexpr";

export type ArithOp = "/" | "*" | "+" | "-";

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

function checkGetComponents(comps: string, setter: AllVals, vec: Vec) {
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

function duplicateComponents(comps: string) {
  return new Set(comps.split("")).size !== comps.length;
}

export class ChangeCompExpr<T extends Vec, U extends AllVals> extends Op<T> {
  originalVec: T;
  newVal: U;

  constructor(vec: T, setter: U, comps: string, op?: ArithOp) {
    checkGetComponents(comps, setter, vec);
    // part of name of custom function
    const suffix = `${vec.typeString()}_${setter.typeString()}_${comps}`;
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

  setOriginal(originalVec: T) {
    this.setUniform("uOriginal" + this.id, originalVec);
    this.originalVec = originalVec;
  }

  setNew(newVal: U | number) {
    this.setUniform("uNew" + this.id, newVal);
    // TODO way to get rid of this cast?
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
 * @param op optionally do an operation (`"+"`, `"-"`, `"/"`, `"*"`) instead of
 * setting the component directly
 */
export function changecomp(vec: any, setter: any, comps: string, op?: ArithOp) {
  return new ChangeCompExpr(vec, wrapInValue(setter), comps, op);
}
