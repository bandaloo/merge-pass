import { Effect } from "./effect";
export declare class Merger {
    private effects;
    private fShaders;
    private programs;
    private repeatNums;
    /** the context to render to */
    private gl;
    /** the context to apply post-processing to */
    private source;
    private vShader;
    private texFront;
    private texBack;
    private framebuffer;
    constructor(effects: Effect[], source: TexImageSource, gl: WebGL2RenderingContext);
    private makeTexture;
    private sendTexture;
    private generateCode;
    draw(): void;
}
