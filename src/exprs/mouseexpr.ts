import { ExprVec2, tag } from "./expr";

/** mouse position expression */
export class MouseExpr extends ExprVec2 {
  constructor() {
    super(tag`uMouse`, []);
    this.needs.mouseUniform = true;
  }
}

/**
 * creates an expression that evaluates to a vector representing the mouse
 * position in pixels
 */
export function mouse() {
  return new MouseExpr();
}
