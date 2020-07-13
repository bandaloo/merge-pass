// TODO this might not be necessary!
export class BufferTarget {
  image?: TexImageSource | WebGLTexture;

  constructor(image?: TexImageSource | WebGLTexture) {
    this.image = image;
  }
}

export function buffer(image?: TexImageSource | WebGLTexture) {
  return new BufferTarget(image);
}
