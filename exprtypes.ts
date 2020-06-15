import {
  ExprFloat,
  ExprVec,
  Mutable,
  PrimitiveFloat,
  PrimitiveVec,
  PrimitiveVec2,
  PrimitiveVec3,
  PrimitiveVec4,
  Operator,
} from "./expressions/expr";

export type Float =
  | PrimitiveFloat
  | ExprFloat
  | Operator<Float>
  | Mutable<PrimitiveFloat>;
export type Vec =
  | PrimitiveVec
  | ExprVec
  | Operator<Vec>
  | Mutable<PrimitiveVec>;
export type Vec2 =
  | PrimitiveVec2
  | ExprVec
  | Operator<Vec2>
  | Mutable<PrimitiveVec2>;
export type Vec3 =
  | PrimitiveVec3
  | ExprVec
  | Operator<Vec3>
  | Mutable<PrimitiveVec3>;
export type Vec4 =
  | PrimitiveVec4
  | ExprVec
  | Operator<Vec4>
  | Mutable<PrimitiveVec4>;
export type AllVals = Float | Vec;

/*
export type RawFloat = number;
type NamedFloat = [string, number];
type DefaultFloat = [number];
export type Float =
  | RawFloat
  | NamedFloat
  | DefaultFloat
  | Operator<ExprFloat>
  | ExprFloat;

export type RawVec2 = [number, number];
type NamedVec2 = [string, RawVec2];
type DefaultVec2 = [RawVec2];
export type Vec2 =
  | RawVec2
  | NamedVec2
  | DefaultVec2
  | Operator<ExprVec2>
  | ExprVec2;

export type RawVec3 = [number, number, number];
type NamedVec3 = [string, RawVec3];
type DefaultVec3 = [RawVec3];
export type Vec3 =
  | RawVec3
  | NamedVec3
  | DefaultVec3
  | Operator<ExprVec3>
  | ExprVec3;

export type RawVec4 = [number, number, number, number];
type NamedVec4 = [string, RawVec4];
type DefaultVec4 = [RawVec4];
export type Vec4 =
  | RawVec4
  | NamedVec4
  | DefaultVec4
  | Operator<ExprVec4>
  | ExprVec4;

export type Vec = Vec2 | Vec3 | Vec4 | VecExpr;
export type RawVec = RawVec2 | RawVec3 | RawVec4;
export type NamedVec = NamedVec2 | NamedVec3 | NamedVec4;
export type DefaultVec = DefaultVec2 | DefaultVec3 | DefaultVec4;

export type DefaultUniformVal = DefaultFloat | DefaultVec;
export type RawUniformVal = RawFloat | RawVec;
export type NamedUniformVal = NamedFloat | NamedVec;

export type UniformVal = Float | Vec;
*/
