import { UniformLocs, EffectLoop } from "../mergepass";
import { WebGLProgramElement } from "../webglprogramloop";
import { AllVals, Float } from "../exprtypes";

interface UniformTypeMap {
  // TODO give a proper type that only denotes type names
  [name: string]: string;
}

/** info needed to generate proper declarations */
export interface BuildInfo {
  uniformTypes: UniformTypeMap;
  externalFuncs: Set<string>;
  exprs: Expr[];
  needs: Needs;
}

/**
 * turn a value (can be expression or primitive) into a string
 * @param val the value that gets parsed
 * @param defaultName what to name it if it is unnamed uniform
 * @param e the enclosing expression
 * @param buildInfo the top level effect to add uniforms and functions to
 */
/*
export function vparse(
  val: UniformVal, // becomes this
  defaultName: string, // becomes member
  e: Expr,
  buildInfo: BuildInfo
): string {
  // parse the expression if it's an expression
  console.log("in vparse");
  if (val instanceof Expr) {
    return val.parse(buildInfo);
  }
  // TODO everything beyond this will become the member function
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
    // get the `RawUniformVal` from the `NamedUniformVal`
    const uniformVal = namedVal[1];
    // set to true so they are set to their default values on first draw
    e.uniformValChangeMap[name] = { val: uniformVal, changed: true };
    // add the new type to the map
    buildInfo.uniformTypes[name] = uniformGLSLTypeStr(uniformVal);
    // add the name mapping
    e.defaultNameMap[defaultName] = name;
    console.log("default name", defaultName);
    return name;
  }
  // not a named value, so it can be inserted into code directly like a macro
  const uniformVal = val as RawVec;
  return `vec${uniformVal.length}(${uniformVal
    .map((n) => toGLSLFloatString(n))
    .join(", ")})`;
}
*/

// TODO! move to primitive
function toGLSLFloatString(num: number) {
  let str = "" + num;
  if (!str.includes(".")) str += ".";
  return str;
}

// this should be on expression
export interface UniformValChangeMap {
  [name: string]: { val: Primitive; changed: boolean };
}

// TODO don't really want to expose this
export interface DefaultNameMap {
  [name: string]: string;
}

export interface Needs {
  depthBuffer: boolean;
  neighborSample: boolean;
  centerSample: boolean;
}

export interface SourceLists {
  sections: string[];
  values: AllVals[];
}

interface Parseable {
  parse: (
    buildInfo: BuildInfo,
    defaultName: string,
    enc: Expr | undefined
  ) => string;
}

export interface Applicable {
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation): void;
}

export abstract class Expr implements Parseable {
  static count = 0;
  id: string;
  needs: Needs = {
    depthBuffer: false,
    neighborSample: false,
    centerSample: true,
  };
  defaultNames: string[];
  uniformValChangeMap: UniformValChangeMap = {};
  defaultNameMap: DefaultNameMap = {};
  externalFuncs: string[] = [];
  sourceLists: SourceLists;
  sourceCode: string = "";

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    this.id = "_id_" + Expr.count;
    Expr.count++;
    if (sourceLists.sections.length - sourceLists.values.length !== 1) {
      // this cannot happen if you use `tag` to destructure a template string
      throw new Error("wrong lengths for source and values");
    }
    if (sourceLists.values.length !== defaultNames.length) {
      console.log(sourceLists.values);
      console.log(sourceLists.sections);
      console.log(defaultNames);
      throw new Error(
        "default names list length doesn't match values list length!"
      );
    }
    this.sourceLists = sourceLists;
    this.defaultNames = defaultNames;
  }

  applyUniforms(gl: WebGL2RenderingContext, uniformLocs: UniformLocs) {
    for (const name in this.uniformValChangeMap) {
      const loc = uniformLocs[name];
      if (this.uniformValChangeMap[name].changed) {
        this.uniformValChangeMap[name].changed = false;
        this.uniformValChangeMap[name].val.applyUniform(gl, loc);
      }
    }
  }

  /** expression and loops both implement this */
  getNeeds(name: keyof Needs) {
    return this.needs[name];
  }

  getSampleNum(mult = 1) {
    return this.needs.neighborSample ? mult : 0;
  }

  setUniform(name: string, newVal: Primitive) {
    // if name does not exist, try mapping default name to new name
    if (this.uniformValChangeMap[name]?.val === undefined) {
      name = this.defaultNameMap[name];
    }
    const oldVal = this.uniformValChangeMap[name]?.val;
    if (oldVal === undefined) {
      console.log(this.defaultNameMap);
      throw new Error("tried to set uniform " + name + " which doesn't exist.");
    }
    if (oldVal.typeString() !== newVal.typeString()) {
      throw new Error("tried to set uniform " + name + " to a new type");
    }
    this.uniformValChangeMap[name].val = newVal;
    this.uniformValChangeMap[name].changed = true;
  }

  /** parses this expression into a string, adding info as it recurses */
  parse(buildInfo: BuildInfo): string {
    console.log("pushing expr to buildinfo!");
    buildInfo.exprs.push(this);
    const updateNeed = (name: keyof Needs) =>
      (buildInfo.needs[name] = buildInfo.needs[name] || this.needs[name]);
    // no good way to iterate through an interface
    updateNeed("centerSample");
    updateNeed("neighborSample");
    updateNeed("depthBuffer");
    // add each of the external funcs to the builder
    console.log(this.externalFuncs);
    this.externalFuncs.forEach((func) => buildInfo.externalFuncs.add(func));
    // put all of the values between all of the source sections
    for (let i = 0; i < this.sourceLists.values.length; i++) {
      this.sourceCode +=
        this.sourceLists.sections[i] +
        this.sourceLists.values[i].parse(buildInfo, this.defaultNames[i], this);
      /*
      this.sourceCode +=
        this.sourceLists.sections[i] +
        vparse(
          this.sourceLists.values[i],
          this.defaultNames[i] + this.id,
          this,
          buildInfo
        );
      */
    }
    // TODO does sourceCode have to be a member?
    this.sourceCode += this.sourceLists.sections[
      this.sourceLists.sections.length - 1
    ];
    return this.sourceCode;
  }
}

export class Mutable<T extends Primitive> implements Applicable {
  primitive: T;
  name: string | undefined;

  constructor(primitive: T, name?: string) {
    this.primitive = primitive;
    this.name = name;
  }

  parse(buildInfo: BuildInfo, defaultName: string, enc: Expr | undefined) {
    if (enc === undefined) {
      throw new Error("tried to put a mutable expression at the top level");
    }
    // accept the default name if given no name
    if (this.name === undefined) this.name = defaultName + enc.id;
    // set to true so they are set to their default values on first draw
    buildInfo.uniformTypes[this.name] = this.primitive.typeString();
    // add the name mapping
    enc.uniformValChangeMap[this.name] = {
      val: this.primitive,
      changed: true,
    };
    // add the new type to the map
    enc.defaultNameMap[defaultName] = name;
    // insert the uniform name into the source code
    return this.name;
  }

  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    this.primitive.applyUniform(gl, loc);
  }
}

export function mut<T extends Primitive>(primitive: T) {
  return new Mutable(primitive);
}

export function mutn(num: number) {
  return new Mutable(n2p(num));
}

export abstract class Primitive implements Parseable, Applicable {
  abstract toString(): string;

  abstract typeString(): string;

  // TODO move to Mutable
  abstract applyUniform(
    gl: WebGL2RenderingContext,
    loc: WebGLUniformLocation
  ): void;

  parse(buildInfo: BuildInfo, defaultName: string, enc: Expr | undefined) {
    return this.toString();
  }

  /*
  parse(buildInfo: BuildInfo, enc: Expr) {
    return `vec${this.value.length}(${this.value
      .map((n) => toGLSLFloatString(n))
      .join(", ")})`;
  }
  */
}

export class PrimitiveFloat extends Primitive {
  value: number;

  constructor(num: number) {
    // TODO throw error when NaN, Infinity or -Infinity
    super();
    this.value = num;
  }

  toString() {
    let str = "" + this.value;
    if (!str.includes(".")) str += ".";
    return str;
  }

  typeString() {
    return "float";
  }

  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    gl.uniform1f(loc, this.value);
  }
}

export abstract class PrimitiveVec extends Primitive {
  value: number[];

  constructor(comps: number[]) {
    super();
    this.value = comps;
  }

  typeString() {
    return "vec" + this.value.length;
  }

  toString() {
    return `${this.typeString}(${this.value
      .map((n) => toGLSLFloatString(n))
      .join(", ")})`;
  }
}

export class PrimitiveVec2 extends PrimitiveVec {
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    gl.uniform2f(loc, this.value[0], this.value[1]);
  }
}

export class PrimitiveVec3 extends PrimitiveVec {
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    gl.uniform3f(loc, this.value[0], this.value[1], this.value[2]);
  }
}

export class PrimitiveVec4 extends PrimitiveVec {
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    gl.uniform4f(
      loc,
      this.value[0],
      this.value[1],
      this.value[2],
      this.value[3]
    );
  }
}

export abstract class ExprVec extends Expr {
  values: Float[];
  defaultNames: string[];

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
    const values = sourceLists.values as Float[];
    this.values = values;
    this.defaultNames = defaultNames;
  }

  setComp(index: number, primitive: PrimitiveFloat | number) {
    if (index < 0 || index >= this.values.length) {
      throw new Error("out of bounds of setting component");
    }
    if (typeof primitive === "number") primitive = n2p(primitive);
    this.setUniform(this.defaultNames[index], primitive);
  }
}

export class ExprFloat extends Expr {
  private float = undefined; // brand for nominal typing

  getSize() {
    return 1;
  }
}

export class ExprVec2 extends ExprVec {
  private vec2 = undefined; // brand for nominal typing

  getSize() {
    return 2;
  }
}

export class ExprVec3 extends ExprVec {
  private vec3: void; // brand for nominal typing

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
  }

  getSize() {
    return 3;
  }
}

export class ExprVec4 extends ExprVec {
  private vec4 = undefined; // brand for nominal typing

  repeat(num: number) {
    return new EffectLoop([this], { num: num });
  }

  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs
  ): WebGLProgramElement {
    return new EffectLoop([this], { num: 1 }).genPrograms(
      gl,
      vShader,
      uniformLocs
    );
  }

  getSize() {
    return 4;
  }
}

// TODO! still needed?
/*
export function uniformGLSLTypeNum(val: RawUniformVal) {
  if (typeof val === "number") {
    return 1;
  }
  return val.length;
}
*/

// TODO! still needed?
/*
export function uniformGLSLTypeStr(val: RawUniformVal) {
  const num = uniformGLSLTypeNum(val);
  if (num === 1) return "float";
  if (num >= 2 && num <= 4) return "vec" + num;
  throw new Error("cannot convert " + val + " to a GLSL type");
}
*/
export class Operator<T extends AllVals> extends Expr {
  ret: T;

  constructor(ret: T, sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
    this.ret = ret;
  }
}

/** number to expression float */
export function n2e(num: number | Float) {
  if (
    num instanceof PrimitiveFloat ||
    num instanceof ExprFloat ||
    num instanceof Operator ||
    num instanceof Mutable
  )
    return num;
  return new PrimitiveFloat(num);
}

/** number to primitive float */
export function n2p(num: number | PrimitiveFloat) {
  if (num instanceof PrimitiveFloat) return num;
  return new PrimitiveFloat(num);
}

/** number or primitive to primitive */
export function np2p(p: number | Primitive) {
  if (p instanceof Primitive) return p;
  return new PrimitiveFloat(p);
}

export function tag(
  strings: TemplateStringsArray,
  ...values: AllVals[]
): SourceLists {
  return { sections: strings.concat([]), values: values };
}

/*
export function tagf(
  strings: TemplateStringsArray,
  ...values: Float[]
): FloatSourceLists {
  return { sections: strings.concat([]), values: values };
}
*/
