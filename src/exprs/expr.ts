import { UniformLocs, EffectLoop, EffectLike, Generable } from "../mergepass";
import { AllVals, Float, TypeString } from "../exprtypes";
import { updateNeeds } from "../webglprogramloop";
import { brandWithChannel, brandWithRegion } from "../utils";

interface UniformTypeMap {
  [name: string]: TypeString;
}

/** info needed to generate proper declarations */
export interface BuildInfo {
  uniformTypes: UniformTypeMap;
  externalFuncs: Set<string>;
  exprs: Expr[];
  needs: Needs;
}

/**
 * adds a `.` after a number if needed (e.g converts `1` to `"1."` but leaves
 * `1.2` as `"1.2"`)
 * @param num number to convert
 */
function toGLSLFloatString(num: number) {
  let str = "" + num;
  if (!str.includes(".")) str += ".";
  return str;
}

export interface UniformValChangeMap {
  [name: string]: { val: Primitive; changed: boolean };
}

export interface DefaultNameMap {
  [name: string]: string;
}

export interface Needs {
  neighborSample: boolean;
  centerSample: boolean;
  sceneBuffer: boolean;
  timeUniform: boolean;
  mouseUniform: boolean;
  passCount: boolean;
  extraBuffers: Set<number>;
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

  /** returns the GLSL type as a string */
  typeString(): TypeString;

  brandExprWithRegion(space: Float[] | Float): Parseable;
}

export interface Applicable {
  /**
   * directly sets a uniform in a program; user should use [[setUniform]]
   * instead
   */
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation): void;
}

export abstract class Expr implements Parseable, EffectLike {
  /**
   * increments for each expression created; used to uniquely id each expression
   */
  static count = 0;
  readonly id: string;
  // update me on change to needs
  readonly needs: Needs = {
    neighborSample: false,
    centerSample: false,
    sceneBuffer: false,
    timeUniform: false,
    mouseUniform: false,
    passCount: false,
    extraBuffers: new Set(),
  };
  readonly defaultNames: string[];
  readonly uniformValChangeMap: UniformValChangeMap = {};
  readonly defaultNameMap: DefaultNameMap = {};
  externalFuncs: string[] = [];
  sourceLists: SourceLists;
  sourceCode: string = "";
  funcIndex = 0;
  regionBranded = false;

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    this.id = "_id_" + Expr.count;
    Expr.count++;
    if (sourceLists.sections.length - sourceLists.values.length !== 1) {
      // this cannot happen if you use `tag` to destructure a template string
      throw new Error("wrong lengths for source and values");
    }
    if (sourceLists.values.length !== defaultNames.length) {
      console.log(sourceLists);
      console.log(defaultNames);
      throw new Error(
        "default names list length doesn't match values list length"
      );
    }
    this.sourceLists = sourceLists;
    this.defaultNames = defaultNames;
  }

  applyUniforms(gl: WebGL2RenderingContext, uniformLocs: UniformLocs) {
    for (const name in this.uniformValChangeMap) {
      const loc = uniformLocs[name];
      if (this.uniformValChangeMap[name].changed) {
        //this.uniformValChangeMap[name].changed = false;
        this.uniformValChangeMap[name].val.applyUniform(
          gl,
          loc.locs[loc.counter]
        );
      }
      // increment and reset the counter to wrap back around to first location
      loc.counter++;
      loc.counter %= loc.locs.length;
      // once we have wrapped then we know all uniforms have been changed
      if (loc.counter === 0) {
        this.uniformValChangeMap[name].changed = false;
      }
    }
  }

  getSampleNum(mult = 1): number {
    return this.needs.neighborSample
      ? mult
      : this.sourceLists.values
          .map((v) => v.getSampleNum())
          .reduce((acc, curr) => acc + curr, 0) > 0
      ? mult
      : 0;
  }

  /**
   * set a uniform by name directly
   * @param name uniform name in the source code
   * @param newVal value to set the uniform to
   */
  setUniform(name: string, newVal: AllVals | number) {
    newVal = wrapInValue(newVal);
    const originalName = name;
    if (typeof newVal === "number") {
      newVal = wrapInValue(newVal);
    }
    if (!(newVal instanceof Primitive)) {
      throw new Error("cannot set a non-primitive");
    }
    // if name does not exist, try mapping default name to new name
    if (this.uniformValChangeMap[name]?.val === undefined) {
      name = this.defaultNameMap[name];
    }
    const oldVal = this.uniformValChangeMap[name]?.val;
    if (oldVal === undefined) {
      throw new Error(
        "tried to set uniform " +
          name +
          " which doesn't exist. original name: " +
          originalName
      );
    }
    if (oldVal.typeString() !== newVal.typeString()) {
      throw new Error("tried to set uniform " + name + " to a new type");
    }
    this.uniformValChangeMap[name].val = newVal;
    this.uniformValChangeMap[name].changed = true;
  }

  /**
   * parses this expression into a string, adding info as it recurses into
   * nested expressions
   */
  parse(buildInfo: BuildInfo): string {
    this.sourceCode = "";
    buildInfo.exprs.push(this);
    buildInfo.needs = updateNeeds(buildInfo.needs, this.needs);
    // add each of the external funcs to the builder
    this.externalFuncs.forEach((func) => buildInfo.externalFuncs.add(func));
    // put all of the values between all of the source sections
    for (let i = 0; i < this.sourceLists.values.length; i++) {
      this.sourceCode +=
        this.sourceLists.sections[i] +
        this.sourceLists.values[i].parse(buildInfo, this.defaultNames[i], this);
    }
    // TODO does sourceCode have to be a member?
    this.sourceCode += this.sourceLists.sections[
      this.sourceLists.sections.length - 1
    ];
    return this.sourceCode;
  }

  abstract typeString(): TypeString;

  addFuncs(funcs: string[]) {
    this.externalFuncs.push(...funcs);
    return this;
  }

  brandExprWithChannel(funcIndex: number, samplerNum?: number) {
    brandWithChannel(
      this.sourceLists,
      this.externalFuncs,
      this.needs,
      funcIndex,
      samplerNum
    );
    return this;
  }

  brandExprWithRegion(space: Float[] | Float) {
    brandWithRegion(this, this.funcIndex, space);
    for (const v of this.sourceLists.values) {
      v.brandExprWithRegion(space);
    }
    return this;
  }
}

function genCustomNames(sourceLists: SourceLists) {
  const names = [];
  for (let i = 0; i < sourceLists.values.length; i++) {
    names.push("uCustomName" + i);
  }
  return names;
}

/** create a custom float function (use with [[tag]]) */
export function cfloat(sourceLists: SourceLists, externalFuncs: string[] = []) {
  return new ExprFloat(sourceLists, genCustomNames(sourceLists)).addFuncs(
    externalFuncs
  );
}

/** create a custom vec2 function (use with [[tag]]) */
export function cvec2(sourceLists: SourceLists, externalFuncs: string[] = []) {
  return new ExprVec2(sourceLists, genCustomNames(sourceLists)).addFuncs(
    externalFuncs
  );
}

/** create a custom vec3 function (use with [[tag]]) */
export function cvec3(sourceLists: SourceLists, externalFuncs: string[] = []) {
  return new ExprVec3(sourceLists, genCustomNames(sourceLists)).addFuncs(
    externalFuncs
  );
}

/** create a custom vec4 function (use with [[tag]]) */
export function cvec4(sourceLists: SourceLists, externalFuncs: string[] = []) {
  return new ExprVec4(sourceLists, genCustomNames(sourceLists)).addFuncs(
    externalFuncs
  );
}

export class Mutable<T extends Primitive>
  implements Parseable, Applicable, EffectLike {
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
    enc.defaultNameMap[defaultName + enc.id] = this.name;
    return this.name;
  }

  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    this.primitive.applyUniform(gl, loc);
  }

  typeString() {
    return this.primitive.typeString();
  }

  getSampleNum() {
    return 0;
  }

  brandExprWithRegion(space: Float[] | Float) {
    return this;
  }
}

export function mut<T extends Primitive>(val: T, name?: string): Mutable<T>;

export function mut(val: number, name?: string): Mutable<PrimitiveFloat>;

/**
 * makes a primitive value mutable. wrapping a [[PrimitiveVec]] or
 * [[PrimitiveFloat]] in [[mut]] before passing it into an expression will
 * allow you to use the setters on that expression to change those values at
 * runtime
 * @param val the primitive float or primitive vec to make mutable
 * @param name the optional name for the uniform
 */
export function mut<T extends Primitive>(val: T | number, name?: string) {
  const primitive = typeof val === "number" ? wrapInValue(val) : val;
  return new Mutable(primitive, name);
}

export abstract class Primitive implements Parseable, Applicable, EffectLike {
  abstract toString(): string;

  abstract typeString(): TypeString;

  abstract applyUniform(
    gl: WebGL2RenderingContext,
    loc: WebGLUniformLocation
  ): void;

  parse() {
    return this.toString();
  }

  getSampleNum() {
    return 0;
  }

  brandExprWithRegion(space: Float[] | Float) {
    return this;
  }
}

export class PrimitiveFloat extends Primitive {
  value: number;

  constructor(num: number) {
    if (!isFinite(num)) throw new Error("number not finite");
    super();
    this.value = num;
  }

  toString() {
    let str = "" + this.value;
    if (!str.includes(".")) str += ".";
    return str;
  }

  typeString() {
    return "float" as TypeString;
  }

  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    gl.uniform1f(loc, this.value);
  }
}

export abstract class PrimitiveVec extends Primitive {
  values: number[];

  constructor(comps: number[]) {
    super();
    this.values = comps;
  }

  typeString() {
    return ("vec" + this.values.length) as TypeString;
  }

  toString() {
    return `${this.typeString()}(${this.values
      .map((n) => toGLSLFloatString(n))
      .join(", ")})`;
  }
}

export class PrimitiveVec2 extends PrimitiveVec {
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    gl.uniform2f(loc, this.values[0], this.values[1]);
  }
}

export class PrimitiveVec3 extends PrimitiveVec {
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    gl.uniform3f(loc, this.values[0], this.values[1], this.values[2]);
  }
}

export class PrimitiveVec4 extends PrimitiveVec {
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    gl.uniform4f(
      loc,
      this.values[0],
      this.values[1],
      this.values[2],
      this.values[3]
    );
  }
}

export abstract class BasicVec extends Expr {
  values: Float[];
  defaultNames: string[];

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
    // this cast is fine as long as you only instantiate these with the
    // shorthand version and not the constructor
    const values = sourceLists.values as Float[];
    this.values = values;
    this.defaultNames = defaultNames;
  }

  typeString() {
    return ("vec" + this.values.length) as TypeString;
  }

  /** sets a component of the vector */
  setComp(index: number, primitive: PrimitiveFloat | number) {
    if (index < 0 || index >= this.values.length) {
      throw new Error("out of bounds of setting component");
    }
    this.setUniform(this.defaultNames[index] + this.id, wrapInValue(primitive));
  }
}

export class BasicVec2 extends BasicVec {
  private bvec2 = undefined; // brand for nominal typing
}

export class BasicVec3 extends BasicVec {
  private bvec3 = undefined; // brand for nominal typing
}

export class BasicVec4 extends BasicVec {
  private bvec4 = undefined; // brand for nominal typing
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
}

export class BasicFloat extends Expr {
  private float = undefined; // brand for nominal typing

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
  }

  setVal(primitive: PrimitiveFloat | number) {
    this.setUniform("uFloat" + this.id, wrapInValue(primitive));
  }

  typeString() {
    return "float" as TypeString;
  }
}

export class ExprFloat extends Expr {
  private float = undefined; // brand for nominal typing

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
  }

  setVal(primitive: PrimitiveFloat | number) {
    this.setUniform("uFloat" + this.id, wrapInValue(primitive));
  }

  typeString() {
    return "float" as TypeString;
  }
}

export function float(value: Float | number) {
  if (typeof value === "number") value = wrapInValue(value);
  return new BasicFloat({ sections: ["", ""], values: [value] }, ["uFloat"]);
}

export class ExprVec2 extends ExprVec {
  private vec2 = undefined; // brand for nominal typing

  typeString() {
    return "vec2" as TypeString;
  }
}

export class ExprVec3 extends ExprVec {
  private vec3 = undefined; // brand for nominal typing

  typeString() {
    return "vec3" as TypeString;
  }
}

export class ExprVec4 extends ExprVec implements Generable {
  private vec4 = undefined; // brand for nominal typing

  repeat(num: number) {
    return new EffectLoop([this], { num: num });
  }

  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs,
    shaders: WebGLShader[]
  ) {
    return new EffectLoop([this], { num: 1 }).genPrograms(
      gl,
      vShader,
      uniformLocs,
      shaders
    );
  }

  typeString() {
    return "vec4" as TypeString;
  }
}

export class WrappedExpr<T extends AllVals> implements Parseable {
  expr: T;

  constructor(expr: T) {
    this.expr = expr;
  }

  typeString(): TypeString {
    return this.expr.typeString();
  }

  parse(buildInfo: BuildInfo, defaultName: string, enc?: Expr): string {
    return this.expr.parse(buildInfo, defaultName, enc);
  }

  getSampleNum(): number {
    return this.expr.getSampleNum();
  }

  brandExprWithRegion(space: Float[] | Float): Parseable {
    return this.expr.brandExprWithRegion(space);
  }
}

export class Operator<T extends AllVals> extends Expr {
  ret: T;

  constructor(ret: T, sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
    this.ret = ret;
  }

  typeString(): TypeString {
    return this.ret.typeString() as TypeString;
  }
}

/** creates a primitive float */
export function pfloat(num: number) {
  return new PrimitiveFloat(num);
}

/** @ignore */
export function wrapInValue(num: number): PrimitiveFloat;
export function wrapInValue<T extends AllVals>(num: T | number): T;
export function wrapInValue<T extends AllVals>(
  num: T | number | undefined
): T | PrimitiveFloat | undefined;
export function wrapInValue<T extends AllVals>(
  num: number | T | undefined
): PrimitiveFloat | T | undefined {
  if (num === undefined) return undefined;
  if (typeof num === "number") return pfloat(num);
  return num;
}

/**
 * takes a template strings array and converts it to a source list; very useful
 * for [[cfloat]], [[cvec2]], [[cvec3]] and [[cvec4]]
 */
export function tag(
  strings: TemplateStringsArray,
  ...values: AllVals[]
): SourceLists {
  return { sections: strings.concat([]), values: values };
}
