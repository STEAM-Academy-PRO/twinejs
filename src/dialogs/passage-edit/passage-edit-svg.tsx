import React from 'react';
import { parseScene, SceneData } from '../../util/story-format/goose-parsers';
import InteractiveScene from '../../util/story-format/interactive-scene';
import { Passage, Story } from '../../store/stories';


const PassageSvgEditor: React.FC<{ 
  disabled?: boolean;
  onChange?: (script: string) => void;
  passage: Passage;
  story: Story;
 }> = ({ 
  disabled,
  onChange,
  passage,
  story,
  }) => {

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (<div style={{
    border: '2px solid #ccc',
    padding: '1em',
    resize: 'vertical',
    overflow: 'auto',
    backgroundColor: `black`,
    position: 'relative',
    }}
    key={`svg-${passage.id}`}
    >
      <div
				className="passage-edit-svg"
				dangerouslySetInnerHTML={{__html: passage.svg}}
			/>
      <button onClick={() => setIsFullscreen(!isFullscreen)}>Toggle Fullscreen</button>
      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          zIndex: 1000,
        }}>
          SVG EDITOR
          <button onClick={() => setIsFullscreen(false)}>Close</button>
        </div>
      )}
    </div>)

};

export default PassageSvgEditor;