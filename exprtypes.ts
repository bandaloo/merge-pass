import {
  ExprFloat,
  ExprVec,
  ExprVec2,
  ExprVec3,
  ExprVec4,
  Mutable,
  Operator,
  PrimitiveFloat,
  PrimitiveVec,
  PrimitiveVec2,
  PrimitiveVec3,
  PrimitiveVec4,
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
  | ExprVec2
  | Operator<Vec2>
  | Mutable<PrimitiveVec2>;
export type Vec3 =
  | PrimitiveVec3
  | ExprVec3
  | Operator<Vec3>
  | Mutable<PrimitiveVec3>;
export type Vec4 =
  | PrimitiveVec4
  | ExprVec4
  | Operator<Vec4>
  | Mutable<PrimitiveVec4>;
export type AllVals = Float | Vec;
export type TypeString = "float" | "vec2" | "vec3" | "vec4";
