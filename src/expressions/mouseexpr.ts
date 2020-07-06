import { ExprVec2, tag } from "./expr";

export class MouseExpr extends ExprVec2 {
  constructor() {
    super(tag`uMouse`, []);
    this.needs.mouseUniform = true;
  }
}

/** gets a vec2 representing the mouse position in pixels */
export function mouse() {
  return new MouseExpr();
}
