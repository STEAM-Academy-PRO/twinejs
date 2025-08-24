// Local minimal type to avoid bundling app modules
type Passage = {
  svg?: string;
  text: string;
};

type Block = {
  title: string;
  props: any;
  message: string;
}

const SCENE_ENDPOINT = '/api/scenes';

export const cache: Record<string, string> = {};

export async function getScene(passage: Passage, force = false){
    if (passage.svg && cache[passage.svg] && !force) return cache[passage.svg];
    if (!passage.svg) return '';
    const svg = await fetch(`${SCENE_ENDPOINT}/${passage.svg}`).then(res => res.text());
    cache[passage.svg] = svg;
    return svg;
}

export async function renderScene(passage: Passage, force = false): Promise<string> {
  // We take the SVG, parse the text, and come up with a populated SVG.

  if (!passage.svg) {
    return '';
  }

  const svg = await getScene(passage, force);
  if (!svg){
    console.error('no SVG was returned.')
    return '';
  }

  const svgDoc = new DOMParser().parseFromString(svg, "text/xml");

  // Attach a live clone of the SVG once for measurement and mutation
  const attached = attachSvgForMeasurement(svgDoc);
  if (!attached) {
    console.error('Failed to attach SVG for measurement.');
    return '';
  }
  const { container, svg: liveSvg } = attached;

  const idMap = svgIdMap(liveSvg);
  // console.log('idmap:', idMap)
  const sceneObject = parseBlocks(passage.text);
  // console.log('scene object:', sceneObject)
  renderDialogs(idMap, sceneObject);

  const svgOut = autoscaleSvgForPreview(new XMLSerializer().serializeToString(liveSvg));
  // Detach the live SVG to avoid leaks
  try {
    container.removeChild(liveSvg);
  } catch (e) {
    // ignore: container may already be cleared
  }
  // console.log(svgOut)
  // Todo:
  // - render dialogs to objects

  return svgOut;
}

function renderDialogs(idMap: {[id: string]: SVGElement}, sceneObject: Array<Block>){
  sceneObject.forEach((block: Block) => {
    appendTextForBlock(idMap, block);
  });
}

function appendTextForBlock(idMap: {[id: string]: SVGElement}, block: Block){
  const targetId = block?.props?.id || block.title;
  console.log('rendering ', targetId, block)
  let target = idMap[targetId];
  if (!target) {
    console.error('no target found for', targetId);
    return;
  }
  if (Array.isArray(target)) target = target[0];

  const bbox = target.getBBox();
  console.log(target, bbox)

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('font-family', 'Titan One');
  target.parentElement?.appendChild(text);
  appendMultilineText(text, block.message, bbox, {fontSize: 35})
}

function appendMultilineText(parent: SVGElement, text: string, bbox: SVGRect, options: {fontSize: number}){
  // Wrap and fit text into bbox by reducing font size as needed.
  const PADDING = 0;
  const PADDING_TOP = 25;
  const maxWidth = Math.max(0, bbox.width - PADDING * 2);
  const maxHeight = Math.max(0, bbox.height - PADDING * 2);

  // Ensure parent is empty before rendering
  while (parent.firstChild) parent.removeChild(parent.firstChild);

  const NS = 'http://www.w3.org/2000/svg';
  const inputLines = text.trim().split('\\n').map(l => l.trim());

  // Helper to measure a string at current font size using a temporary tspan
  function measure(factoryTspan: SVGTSpanElement, content: string): number {
    factoryTspan.textContent = content;
    // Prefer precise measurement when available
    // getComputedTextLength exists on SVGTextContentElement (tspan inherits)
    // Fallback to rough estimate if not available
    const len = (factoryTspan as any).getComputedTextLength?.();
    if (typeof len === 'number' && !Number.isNaN(len)) return len;
    const fs = parseFloat(parent.getAttribute('font-size') || `${currentFontSize}`) || currentFontSize;
    return content.length * fs * 0.6;
  }

  let currentFontSize = options.fontSize;
  const MIN_FONT = 12;

  // We do two passes per size: first compute wrapped lines, then render centered
  while (currentFontSize >= MIN_FONT) {
    // Prepare measurement tspan
    parent.setAttribute('font-size', String(currentFontSize));
    const measureTspan = document.createElementNS(NS, 'tspan');
    measureTspan.setAttribute('x', String(bbox.x + PADDING));
    measureTspan.setAttribute('y', String(bbox.y + PADDING_TOP));
    parent.appendChild(measureTspan);

    const wrappedLines: string[] = [];
    let overflow = false;
    const lineHeight = currentFontSize * 1.1;

    for (const rawLine of inputLines) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      // Handle empty line explicitly
      if (words.length === 0) {
        wrappedLines.push('');
        continue;
      }

      let line = '';
      for (const w of words) {
        if (line === '') {
          // If a single word is too long, we still accept it here; font reduction will handle it
          const test = w;
          const wlen = measure(measureTspan, test);
          if (wlen <= maxWidth || maxWidth === 0) {
            line = test;
          } else {
            // Word alone exceeds width; trigger overflow to reduce font
            overflow = true;
            line = test; // keep content for further processing
          }
        } else {
          const test = line + ' ' + w;
          const tlen = measure(measureTspan, test);
          if (tlen <= maxWidth || maxWidth === 0) {
            line = test;
          } else {
            wrappedLines.push(line);
            line = w;
          }
        }
      }
      wrappedLines.push(line);
    }

    const totalHeight = wrappedLines.length * lineHeight;
    if (totalHeight > maxHeight + 0.1 || overflow) {
      // Reduce font and try again
      parent.removeChild(measureTspan);
      currentFontSize -= 2;
      continue;
    }

    // Fits: render centered vertically
    parent.removeChild(measureTspan);
    const yStart = bbox.y + (bbox.height - totalHeight) / 2 + PADDING_TOP;
    let y = yStart;
    for (const ln of wrappedLines) {
      const tspan = document.createElementNS(NS, 'tspan');
      tspan.setAttribute('x', String(bbox.x + PADDING));
      tspan.setAttribute('y', String(y));
      tspan.textContent = ln;
      parent.appendChild(tspan);
      y += lineHeight;
    }
    return; // done
  }

  // If we exit the loop, render at MIN_FONT even if it overflows (best effort)
  parent.setAttribute('font-size', String(MIN_FONT));
  const fallback = document.createElementNS(NS, 'tspan');
  fallback.setAttribute('x', String(bbox.x + PADDING));
  fallback.setAttribute('y', String(bbox.y + PADDING));
  fallback.textContent = text.replace(/\s+/g, ' ').trim();
  parent.appendChild(fallback);
}

function svgIdMap(root: ParentNode) {
    const idMap: {[id: string]: SVGElement} = {};
    (root as ParentNode).querySelectorAll?.('[id]')?.forEach((el) => {
        const id = (el as Element).getAttribute('id');
        if (!id) return;
        idMap[id] = el as SVGElement;
    });
    return idMap;
}

export function scaleSvgForPersistence(svgDoc: SVGElement) {
    const svgEle = svgDoc.querySelector("svg");
    if (!svgEle) return svgDoc;
    svgEle.setAttribute("width", "1920");
    svgEle.setAttribute("height", "1080");
    svgEle.setAttribute("viewBox", "0 0 1920 1080");
    return svgDoc;
}

export function autoscaleSvgForPreviewDoc(svgDoc: Document): Document {
  const svgEle = svgDoc.querySelector("svg") as SVGSVGElement | null;
  if (!svgEle) return svgDoc;
  svgEle.removeAttribute("width");
  svgEle.removeAttribute("height");
  svgEle.setAttribute("viewBox", "0 0 1920 1080");
  return svgDoc;
}

export function autoscaleSvgForPreview(svg: string):string{
  return new XMLSerializer().serializeToString(
    autoscaleSvgForPreviewDoc(
      new DOMParser().parseFromString(svg, "text/xml")
    )
  );
}

// Hidden offscreen container + attach helper
let __svgMeasureContainer: HTMLDivElement | null = null;

function ensureMeasureContainer(): HTMLDivElement {
  if (__svgMeasureContainer && document.body.contains(__svgMeasureContainer)) return __svgMeasureContainer;
  const div = document.createElement('div');
  div.setAttribute('data-svg-measure-container', '');
  div.style.position = 'absolute';
  div.style.left = '-99999px';
  div.style.top = '-99999px';
  // Use visibility hidden (not display: none) so layout occurs
  div.style.visibility = 'hidden';
  document.body.appendChild(div);
  __svgMeasureContainer = div;
  return div;
}

function attachSvgForMeasurement(srcDoc: Document): { container: HTMLDivElement, svg: SVGSVGElement } | null {
  const srcSvg = srcDoc.querySelector('svg') as SVGSVGElement | null;
  if (!srcSvg) return null;
  const container = ensureMeasureContainer();

  const clone = srcSvg.cloneNode(true) as SVGSVGElement;
  // Ensure concrete width/height for layout while preserving/forcing viewBox
  const vb = clone.getAttribute('viewBox');
  if (!vb) clone.setAttribute('viewBox', '0 0 1920 1080');
  clone.setAttribute('width', '1920');
  clone.setAttribute('height', '1080');

  container.appendChild(clone);
  return { container, svg: clone };
}

/**
 * Parse SomeTitle({...json...}) message is here into an array of
 * [{
 *    title: "SomeTitle",
 *    props: {...json...},
 *    message: "message is here"
 * }]
 * @param text
 * @returns
 */
function parseBlocks(text: string): Array<Block> {
    const out: Array<Block> = [];
    const re = /([A-Za-z][A-Za-z0-9_]*)\s*\(\s*\{/g; // finds Title( {...
    let m;

    while ((m = re.exec(text))) {
      const title = m[1];
      const firstBrace = text.indexOf("{", m.index);
      if (firstBrace === -1) continue;

      // Brace-aware scan to matching }
      let depth = 0, inStr = null, esc = false, j = firstBrace;
      for (; j < text.length; j++) {
        const ch = text[j];

        if (inStr) {
          if (esc) esc = false;
          else if (ch === "\\") esc = true;
          else if (ch === inStr) inStr = null;
          continue;
        }

        if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) break; // j at matching }
        }
      }
      if (depth !== 0) continue; // unbalanced

      const propsStr = text.slice(firstBrace, j + 1);

      // Expect optional space then ')'
      let k = j + 1;
      while (k < text.length && /\s/.test(text[k])) k++;
      if (text[k] !== ")") continue;

      // Message is rest of the line
      let lineEnd = text.indexOf("\n", k + 1);
      if (lineEnd === -1) lineEnd = text.length;
      const message = text.slice(k + 1, lineEnd).trim();

      // Evaluate object literal
      let props;
      try {
        // eslint-disable-next-line no-new-func
        props = new Function('"use strict";return (' + propsStr + ');')();
      } catch {
        re.lastIndex = lineEnd + 1;
        continue;
      }

      out.push({ title, props, message });

      // Advance past this line to find further matches
      re.lastIndex = lineEnd + 1;
    }

    return out;
  }

