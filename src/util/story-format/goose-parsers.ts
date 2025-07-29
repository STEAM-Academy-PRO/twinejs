

export type Character = {
  name?: string;
  posX?: number;
  posY?: number;
  sizeX?: number;
  sizeY?: number;
  mood?: string;
  facing?: 'left' | 'right';
  bubble?: string;
  url?: string;
};

export type DialogLine = {
  name: string;
  mood?: string;
  facing?: 'left' | 'right';
  message?: string;
};

export type SceneData = {
  width: number;
  height: number;
  scene?: string;
  background?: string;
  character?: Character[];
  dialog?: DialogLine[];
};


export type ParsedBlock = {
    name: string;
    message?: string;
  } & Record<string, any>;

  export function parseAtBlockMarkup(input: string): ParsedBlock[] | string {
    // 1️⃣ Normalize multiline blocks into single-line strings
    //    Example:
    //    Frio({
    //      mood: "happy",
    //      facing: "right"
    //    }) Why?
    //
    // becomes:
    //    Frio({mood: "happy", facing: "right"}) Why?

    // if (input === 'scene("Underground Lab")'){
    //     debugger
    // }

    const normalized = input
      .replace(/\n/g, ' ') // flatten everything to one line
      .replace(/\s+/g, ' ') // normalize whitespace
      .replace(/\)\s+/g, ') ') // ensure closing bracket keeps space before message
      .trim();

    // 2️⃣ Regex to match unified block structure:
    //    Name({ ... }) optional : or space message
    const regex = /(\w+)\s*\(\s*\{(.*?)\}\s*\)\s*:? ?([^)]*?)(?=\w+\s*\(|$)/g;

    const results: ParsedBlock[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalized)) !== null) {
      const name = match[1];
      const body = match[2].trim();
      const trailingText = match[3]?.trim();

      const props: Record<string, any> = {};

      // 3️⃣ Split the props by comma (they are now on one line)
      body.split(',').forEach(item => {
        const clean = item.trim();
        if (!clean) return;

        const kvMatch = clean.match(/^(\w+)\s*:\s*(.+)$/);
        // console.log(clean, kvMatch)
        if (kvMatch) {
          const key = kvMatch[1];
          let value: any = kvMatch[2].trim();

          // Handle arrays [144, 444]
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value
              .slice(1, -1)
              .split(',')
              .map((v:string) => v.trim())
              .map((v:string) => (isNaN(Number(v)) ? v : Number(v)));
          }
          // Handle double-quoted strings
          else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          // Handle raw numbers
          else if (!isNaN(Number(value))) {
            value = Number(value);
          }

          props[key] = value;
        }
      });

      const block: ParsedBlock = { name, ... props };
      if (trailingText) {
        block.message = trailingText;
      }

      results.push(block);
    }
    if (!results.length){
        const stringCallRegex = /(\w+)\((['\"])(.*?)\2\)/g;

        // Explanation:
        // (\w+)        → Captures the name (e.g., John)
        // \(           → Literal opening parenthesis
        // (['\"])     → Captures the quote character (single or double)
        // (.*?)        → Captures the string inside
        // \2           → Matches the same type of quote that started it
        // \)           → Literal closing parenthesis

        // Example usage:
        // const matches = [...'John("really feels like it")'.matchAll(stringCallRegex)];
        const matches = [...normalized.matchAll(stringCallRegex)];
        if (matches && matches[0] && matches[0].length > 3){
            return matches[0][3]
        } else {
            return ''
        }
    }

    return results;
  }

//   // ✅ Example usage
//   const text = `
//   Frio({
//     pos: [144, 444],
//     size: [400, 300],
//     mood: "happy",
//     facing: "right",
//     bubble: "top-right",
//     url: "/api/assets/frio.png"
//   }) Why do I have to do anything?

//   Curall({mood: "worried"}): Why would you say that?
//   Frio({facing: "left"}): I touched the button you said not to touch!
//   `;

//   console.log(parseAtBlockMarkup(text));


export function stringifyToBlockMarkup(block: ParsedBlock): string {
    let result = '';

    if (block.name) {
      result += block.name;
    }

    if (block.props && Object.keys(block.props).length > 0) {
      result += '({';

      Object.entries(block.props).forEach(([key, value], index) => {
        if (index > 0) result += ', ';

        result += `${key}: ${value}`;
      });

      result += '})';
    }

    if (block.message) {
      result += `: ${block.message}`;
    }

    return result;
  }




/**
  I have multiple sections that are limited with lines that start with
  @someKeyWord.
  Sometimes they're single line e.g.
  @asdf('somevar') or
  @another({url: 'asdf'}), some are multi line and follow the format of
  Name({whatever JS}) - they can be multiline, like
  Name({
    var1: 'asdf',
    bar: 'foo'
  })

  I want a function that returns an object map where all the section names are keys,
  all the values are their respective values.
  If they follow the `name({whatever JS})` format, they should be another
  Object where the names are the keys, and their values are the one in the parsed parenthesis...`

  The result should be
  */
  const parseSceneTextIntoBlocks = (text: string): Record<string, any> => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const result: Record<string, any> = {};
    let currentKey: string | null = null;
    let currentValue: string = '';

    for (const line of lines) {
      if (line.startsWith('@')) {
        if (currentKey) {
          result[currentKey] = parseAtBlockMarkup(currentValue);
        }
        currentKey = line.slice(1);
        currentValue = '';
        // Check for single line keys:
        const match = line.match(/^@(.*?)\s*\((.*?)\)$/);

        if (match) {
          try{
            result[match[1]] = parseAtBlockMarkup(line.substring(1));
          } catch (e:any){
            console.warn('Error parsing config for', match[1], e.message)
            result[match[1]] = { error: 'Invalid configuration' };
          }
          currentKey = null;
          currentValue = '';
        }
      } else {
        currentValue += line + '\n';
      }
    }
    if (currentKey) {
      result[currentKey] = parseAtBlockMarkup(currentValue);
    }
    return result || {};
  }

export const parseScene = (text: string): SceneData => {
  // Parse the scene data from the text
  const blocks = parseSceneTextIntoBlocks(text);

  // Parse blocks
  return {
    ...blocks,
    width: 1920,
    height: 1080,
  }
}
