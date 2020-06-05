import { Effect, tag } from "..";

class Passthrough extends Effect {
  constructor() {
    super(tag`void main () {
}`);
  }
}
