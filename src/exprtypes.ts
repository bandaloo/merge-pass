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
  BasicFloat,
  BasicVec,
  BasicVec2,
  BasicVec3,
  BasicVec4,
  WrappedExpr,
} from "./exprs/expr";

/** all possible float expressions */
export type Float =
  | PrimitiveFloat
  | ExprFloat
  | Operator<Float>
  | Mutable<PrimitiveFloat>
  | WrappedExpr<Float>
  | BasicFloat;
/** all possible vec expressions */
export type Vec =
  | PrimitiveVec
  | ExprVec
  | Operator<Vec>
  | Mutable<PrimitiveVec>
  | WrappedExpr<Vec>
  | BasicVec;
/** all possible vec2 expressions */
export type Vec2 =
  | PrimitiveVec2
  | ExprVec2
  | Operator<Vec2>
  | Mutable<PrimitiveVec2>
  | WrappedExpr<Vec2>
  | BasicVec2;
/** all possible vec3 expressions */
export type Vec3 =
  | PrimitiveVec3
  | ExprVec3
  | Operator<Vec3>
  | Mutable<PrimitiveVec3>
  | WrappedExpr<Vec3>
  | BasicVec3;
/** all possible vec4 expressions */
export type Vec4 =
  | PrimitiveVec4
  | ExprVec4
  | Operator<Vec4>
  | Mutable<PrimitiveVec4>
  | WrappedExpr<Vec4>
  | BasicVec4;
/** all possible expressions */
export type AllVals = Float | Vec;
/** all type strings */
export type TypeString = "float" | "vec2" | "vec3" | "vec4";
