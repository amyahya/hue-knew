declare module "nearest-color" {
  interface RGB {
    r: number;
    g: number;
    b: number;
  }

  interface ColorMatch {
    name: string;
    value: string;
    rgb: RGB;
    distance: number;
  }

  type ColorMatcher = (hex: string) => ColorMatch;

  interface NearestColor {
    from(colors: Record<string, string>): ColorMatcher;
  }

  const nearestColor: NearestColor;
  export = nearestColor;
}
