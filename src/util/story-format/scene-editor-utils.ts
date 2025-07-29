export interface CoordinateTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculate the transformation from SVG coordinates to DOM coordinates
 * Mimics SVG's preserveAspectRatio="xMidYMid meet" behavior
 */
export function getCoordinateTransform(
  containerElement: HTMLElement,
  svgWidth: number,
  svgHeight: number
): CoordinateTransform {
  const containerRect = containerElement.getBoundingClientRect();

  // Calculate the scale factor maintaining aspect ratio (like preserveAspectRatio="xMidYMid meet")
  const scaleX = containerRect.width / svgWidth;
  const scaleY = containerRect.height / svgHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate the actual rendered size and offset
  const renderedWidth = svgWidth * scale;
  const renderedHeight = svgHeight * scale;
  const offsetX = (containerRect.width - renderedWidth) / 2;
  const offsetY = (containerRect.height - renderedHeight) / 2;

  return {
    scaleX: scale,
    scaleY: scale,
    offsetX,
    offsetY
  };
}

/**
 * Transform SVG coordinates to DOM coordinates
 */
export function svgToDom(
  svgX: number,
  svgY: number,
  transform: CoordinateTransform
): Point {
  return {
    x: svgX * transform.scaleX + transform.offsetX,
    y: svgY * transform.scaleY + transform.offsetY
  };
}

/**
 * Transform DOM coordinates to SVG coordinates
 */
export function domToSvg(
  domX: number,
  domY: number,
  transform: CoordinateTransform
): Point {
  return {
    x: (domX - transform.offsetX) / transform.scaleX,
    y: (domY - transform.offsetY) / transform.scaleY
  };
}``