import React from 'react';

type Character = {
  name: string;
  pos?: [number, number];
  size?: [number, number];
  mood?: string;
  facing?: string;
  bubble?: string;
};

type DialogLine = {
  speaker: string;
  line: string;
  overrides?: Partial<Character>;
};

type SceneData = {
  scene?: string;
  background?: string;
  characters: Record<string, Character>;
  dialog: DialogLine[];
};

// Helper function to parse JSON data in format "Name({... JSON data ...})"
const parseJsonConfig = (lines: string[]): { name: string; config: any } | null => {
  let configLines: string[] = [];
  let currentName: string | null = null;

  // Find the start of a config definition
  const startMatch = lines[0].match(/^\s*(\w+)\s*\(/);
  if (startMatch) {
    currentName = startMatch[1];
    // Look ahead for the closing parenthesis
    let closingParenIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine.includes(')')) {
        closingParenIndex = i;
        break;
      }
    }

    if (closingParenIndex !== -1) {
      // Collect all lines of the config
      configLines = lines.slice(0, closingParenIndex + 1);
      // Remove these lines from the main array
      lines.splice(0, closingParenIndex + 1);

      // Join all config lines and remove the closing parenthesis
      const configStr = configLines.join('\n').replace(/\s*\)\s*$/, '');
      try {
        // Use eval to parse JS object literal syntax
        const config = eval(`(${configStr})`);
        return { name: currentName, config };
      } catch (e) {
        console.error(`Error parsing config for ${currentName}:`, e);
        return null;
      }
    }
  }
  return null;
};

// Helper function to parse dialog lines in format "Name({... JS object ...}): message"
const parseDialogLine = (line: string): { character: string; config: any; message: string } | null => {
  const match = line.match(/^\s*(\w+)\s*(\((.*?)\))?:\s*(.+)$/);
  if (match) {
    const character = match[1];
    const configStr = match[3];
    const message = match[4];
    try {
      // Use eval to parse JS object literal syntax
      const config = configStr ? eval(`(${configStr})`) : {};
      return { character, config, message };
    } catch (e) {
      console.error(`Error parsing dialog config for ${character}:`, e);
      return null;
    }
  }
  return null;
};

const parseScene = (text: string): SceneData => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sceneData: SceneData = { characters: {}, dialog: [] };

  let section: 'scene' | 'background' | 'characters' | 'dialog' | null = null;

  for (const line of lines) {
    if (line.startsWith('@scene')) {
      const match = line.match(/@scene\(["'](.+?)["']\)/);
      if (match) sceneData.scene = match[1];
    } else if (line.startsWith('@background')) {
      const match = line.match(/@background\(["'](.+?)["']\)/);
      if (match) sceneData.background = match[1];
    } else if (line.startsWith('@characters')) {
      section = 'characters';
    } else if (line.startsWith('@dialog')) {
      section = 'dialog';
    } else if (section === 'characters') {
      const result = parseJsonConfig(lines);
      if (result) {
        sceneData.characters[result.name] = { name: result.name, ...result.config };
      }
    } else if (section === 'dialog') {
      const result = parseDialogLine(line);
      if (result) {
        sceneData.dialog.push({
          speaker: result.character,
          line: result.message,
          overrides: result.config
        });
      }
    }
  }
  console.log(sceneData);
  return sceneData;
};

const PassageScenePreview: React.FC<{ script: string }> = ({ script }) => {
  const { scene, background, characters, dialog } = parseScene(script);

  return (
    <div style={{ border: '2px solid #ccc', padding: '1em', position: 'relative', backgroundImage: `url(${background})`, backgroundSize: 'cover', height: 400 }}>
      <h3>{scene}</h3>
      {/* Render Characters */}
      {Object.entries(characters).map(([name, char]) => (
        <div key={name} style={{
          position: 'absolute',
          left: char.pos?.[0],
          top: char.pos?.[1],
          width: char.size?.[0],
          height: char.size?.[1],
          backgroundColor: '#eee',
          border: '1px solid #999',
          textAlign: 'center',
          transform: char.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
        }}>
          <div><strong>{name}</strong></div>
          <div>{char.mood}</div>
        </div>
      ))}

      {/* Render Dialog */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        background: 'rgba(255,255,255,0.8)',
        padding: '0.5em',
        borderRadius: 6
      }}>
        {dialog.map((d, i) => (
          <div key={i}>
            <strong>{d.speaker}</strong> ({d.overrides?.mood || characters[d.speaker]?.mood}): {d.line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PassageScenePreview;