import React from 'react';
import { parseScene, SceneData } from '../../util/story-format/goose-parsers';
import InteractiveScene from '../../util/story-format/interactive-scene';


const PassageSceneEditor: React.FC<{ script: string, setScript: (script: string) => void }> = ({ script, setScript }) => {
  const sceneConfig = parseScene(script);

  return (<div style={{
    border: '2px solid #ccc',
    padding: '1em',
    resize: 'vertical',
    overflow: 'auto',
    backgroundColor: `black`,
    position: 'relative',
    }}
    key={`scene-${sceneConfig.scene}`}
    >
      <InteractiveScene sceneData={sceneConfig as SceneData} />
    </div>)

};

export default PassageSceneEditor;