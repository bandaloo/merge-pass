import { UniformLocs, EffectLoop, EffectLike, Generable } from "../mergepass";
import { AllVals, Float, TypeString } from "../exprtypes";

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
  sceneBuffer: boolean;
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

  typeString(): TypeString;

  added: boolean;
}

export interface Applicable {
  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation): void;
}

export abstract class Expr implements Parseable, EffectLike {
  static count = 0;
  added = false;
  id: string;
  needs: Needs = {
    depthBuffer: false,
    neighborSample: false,
    centerSample: true,
    sceneBuffer: false,
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
        this.uniformValChangeMap[name].changed = false;
        this.uniformValChangeMap[name].val.applyUniform(gl, loc);
      }
    }
  }

  getNeeds(name: keyof Needs) {
    return this.needs[name];
  }

  getSampleNum(mult = 1) {
    return this.needs.neighborSample ? mult : 0;
  }

  setUniform(name: string, newVal: AllVals) {
    const originalName = name;
    if (typeof newVal === "number") {
      newVal = n2p(newVal);
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
          " which doesn't exist." +
          " original name: " +
          originalName
      );
    }
    if (oldVal.typeString() !== newVal.typeString()) {
      throw new Error("tried to set uniform " + name + " to a new type");
    }
    this.uniformValChangeMap[name].val = newVal;
    this.uniformValChangeMap[name].changed = true;
  }

  /** parses this expression into a string, adding info as it recurses */
  parse(buildInfo: BuildInfo): string {
    if (this.added) {
      throw new Error("expression already added to another part of tree");
    }
    this.sourceCode = "";
    buildInfo.exprs.push(this);
    const updateNeed = (name: keyof Needs) =>
      (buildInfo.needs[name] = buildInfo.needs[name] || this.needs[name]);
    // update me on change to needs: no good way to iterate through an interface
    updateNeed("centerSample");
    updateNeed("neighborSample");
    updateNeed("depthBuffer");
    updateNeed("sceneBuffer");
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
    this.added = true;
    return this.sourceCode;
  }

  abstract typeString(): TypeString;
}

export class Mutable<T extends Primitive> implements Parseable {
  primitive: T;
  name: string | undefined;
  added = false;

  constructor(primitive: T, name?: string) {
    this.primitive = primitive;
    this.name = name;
  }

  parse(buildInfo: BuildInfo, defaultName: string, enc: Expr | undefined) {
    if (this.added) {
      throw new Error(
        "mutable expression already added to another part of tree"
      );
    }
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
    this.added = true;
    return this.name;
  }

  applyUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation) {
    this.primitive.applyUniform(gl, loc);
  }

  typeString() {
    return this.primitive.typeString();
  }
}

export function mut<T extends Primitive>(val: T, name?: string): Mutable<T>;

export function mut(val: number, name?: string): Mutable<PrimitiveFloat>;

export function mut<T extends Primitive>(val: T | number, name?: string) {
  const primitive = typeof val === "number" ? n2p(val) : val;
  return new Mutable(primitive, name);
}

export abstract class Primitive implements Parseable {
  added = false;

  abstract toString(): string;

  abstract typeString(): TypeString;

  abstract applyUniform(
    gl: WebGL2RenderingContext,
    loc: WebGLUniformLocation
  ): void;

  parse(buildInfo: BuildInfo, defaultName: string, enc: Expr | undefined) {
    // TODO see if this is okay actually
    if (this.added) {
      throw new Error(
        "primitive expression already added to another part of tree"
      );
    }
    this.added = true;
    return this.toString();
  }
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
    return `${this.typeString}(${this.values
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
    // shorthand version
    const values = sourceLists.values as Float[];
    this.values = values;
    this.defaultNames = defaultNames;
  }

  typeString() {
    return ("vec" + this.values.length) as TypeString;
  }

  setComp(index: number, primitive: PrimitiveFloat | number) {
    if (index < 0 || index >= this.values.length) {
      throw new Error("out of bounds of setting component");
    }
    this.setUniform(this.defaultNames[index] + this.id, n2p(primitive));
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
    this.setUniform("uFloat" + this.id, n2p(primitive));
  }

  typeString() {
    return "float" as TypeString;
  }
}

export abstract class ExprFloat extends Expr {
  private float = undefined; // brand for nominal typing

  constructor(sourceLists: SourceLists, defaultNames: string[]) {
    super(sourceLists, defaultNames);
  }

  setVal(primitive: PrimitiveFloat | number) {
    this.setUniform("uFloat" + this.id, n2p(primitive));
  }

  typeString() {
    return "float" as TypeString;
  }
}

export function float(value: Float | number) {
  if (typeof value === "number") value = n2p(value);
  return new BasicFloat({ sections: ["", ""], values: [value] }, ["uFloat"]);
}

export abstract class ExprVec2 extends ExprVec {
  private vec2 = undefined; // brand for nominal typing

  typeString() {
    return "vec2" as TypeString;
  }
}

export abstract class ExprVec3 extends ExprVec {
  private vec3 = undefined; // brand for nominal typing

  typeString() {
    return "vec3" as TypeString;
  }
}

export abstract class ExprVec4 extends ExprVec implements Generable {
  private vec4 = undefined; // brand for nominal typing

  repeat(num: number) {
    return new EffectLoop([this], { num: num });
  }

  genPrograms(
    gl: WebGL2RenderingContext,
    vShader: WebGLShader,
    uniformLocs: UniformLocs
  ) {
    return new EffectLoop([this], { num: 1 }).genPrograms(
      gl,
      vShader,
      uniformLocs
    );
  }

  typeString() {
    return "vec4" as TypeString;
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

// TODO is this necessary? can we just use wrapInValue?
/** number to expression float */
export function n2e(num: number | Float) {
  if (
    num instanceof PrimitiveFloat ||
    num instanceof ExprFloat ||
    num instanceof Operator ||
    num instanceof Mutable ||
    num instanceof BasicFloat
  )
    return num;
  return new PrimitiveFloat(num);
}

/** number to primitive float */
export function n2p(num: number | PrimitiveFloat) {
  if (num instanceof PrimitiveFloat) return num;
  return new PrimitiveFloat(num);
}

export function pfloat(num: number) {
  return new PrimitiveFloat(num);
}

export function wrapInValue(num: number | AllVals) {
  if (typeof num === "number") return pfloat(num);
  return num;
}

export function tag(
  strings: TemplateStringsArray,
  ...values: AllVals[]
): SourceLists {
  return { sections: strings.concat([]), values: values };
}
