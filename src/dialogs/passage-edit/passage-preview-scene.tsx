import React from 'react';
import { parseAtBlockMarkup, parseScene, SceneData } from '../../util/story-format/goose-parsers';
import SceneRenderer from '../../util/story-format/scene-renderer';
import { SceneEditorToolbar } from '../../routes/story-edit/toolbar/passage/scene-editor-toolbar';



const PassageScenePreview: React.FC<{ script: string }> = ({ script }) => {
  const sceneConfig = parseScene(script);

  const scene = SceneRenderer({
    sceneData: sceneConfig as SceneData
  })

  console.log(sceneConfig)

  return (<div style={{
    border: '2px solid #ccc',
    padding: '1em',
    resize: 'vertical',
    overflow: 'auto',
    backgroundColor: `black`,
    position: 'relative'
    }}
    key={`scene-${sceneConfig.scene}`}
    >
      {scene}
    </div>)

};

export default PassageScenePreview;