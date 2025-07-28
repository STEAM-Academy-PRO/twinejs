// type ParsedBlock = {
//     name: string;
//     props: Record<string, any>;
//     message?: string;
//   };

//   export function parseAtBlockMarkup(input: string): ParsedBlock[] {
//     const result: ParsedBlock[] = [];

//     // Match something like Frio({ ... }) optional text after
//     const regex = /(\w+)\s*\(\s*\{([\s\S]*?)\}\s*\)([^\n]*)/g;
//     let match: RegExpExecArray | null;

//     while ((match = regex.exec(input)) !== null) {
//       const name = match[1];
//       const body = match[2];
//       const trailingText = match[3]?.trim();

//       const props: Record<string, any> = {};

//       body.split('\n').forEach(line => {
//         const clean = line.trim().replace(/,$/, ''); // remove trailing comma
//         if (!clean) return;

//         const kvMatch = clean.match(/^(\w+)\s*:\s*(.+)$/);
//         if (kvMatch) {
//           const key = kvMatch[1];
//           let value: any = kvMatch[2].trim();

//           // Handle arrays: [144, 444]
//           if (value.startsWith('[') && value.endsWith(']')) {
//             value = value
//               .slice(1, -1)
//               .split(',')
//               .map((v: string) => v.trim())
//               .map((v: string) => (isNaN(Number(v)) ? v : Number(v))); // convert numbers
//           }
//           // Handle strings: "happy"
//           else if (value.startsWith('"') && value.endsWith('"')) {
//             value = value.slice(1, -1);
//           }
//           // Handle raw numbers
//           else if (!isNaN(Number(value))) {
//             value = Number(value);
//           }

//           props[key] = value;
//         }
//       });

//       const entry: ParsedBlock = { name, props };

//       if (trailingText) {
//         entry.message = trailingText;
//       }

//       result.push(entry);
//     }

//     return result;
//   }


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
        if (matches[0].length > 3){
            return matches[0][3]
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
