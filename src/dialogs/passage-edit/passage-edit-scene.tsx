import React from 'react';
import { parseAtBlockMarkup } from '../../util/story-format/goose-parsers';
import SceneRenderer, { SceneData } from '../../util/story-format/scene-renderer';


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

const parseScene = (text: string) => {
  // Parse the scene data from the text
  const blocks = parseSceneTextIntoBlocks(text);

  // Parse blocks
  return blocks
}


const PassageScenePreview: React.FC<{ script: string }> = ({ script }) => {
  const sceneConfig = parseScene(script);

  const scene = SceneRenderer({
    sceneData: sceneConfig as SceneData
  })

  return (<div style={{
    border: '2px solid #ccc',
    padding: '1em',
    resize: 'vertical',
    overflow: 'auto',
    backgroundColor: `black`,
    position: 'relative'
    }}>
      {scene}
    </div>)

};

export default PassageScenePreview;