import React from 'react';
import { Character, DialogLine, SceneData } from './goose-parsers';


interface SceneRendererProps {
  sceneData: SceneData;
}

const SpeechBubble: React.FC<{dialogLine: DialogLine, char: Character}> = ({dialogLine, char}) => {
    // Get the first dialog line for each character


  // Function to render a speech bubble
    const message = dialogLine.message;
    if (!message) return null;

    // Approximate from the length of the message
    const bubbleWidth = message.length * 20;
    const bubbleHeight = 100;
    const charSizeX = Number(char.sizeX || 0);
    const charSizeY = Number(char.sizeY || 0);
    const isFacingLeft = char.facing === 'left';

    // Position bubble above character's head
    const bubbleX = 0// isFacingLeft ? -bubbleWidth / 2 : charSizeX / 2 - bubbleWidth / 2;
    const bubbleY = -bubbleHeight - 20; // 20px above character

    // Tail position
    const tailX = charSizeX * 0.5;
    const tailY = bubbleHeight;

    // Tail points (triangle)
    const tailPoints = isFacingLeft
      ? `${tailX},${tailY + 40} ${tailX - 30},${tailY} ${tailX + 30},${tailY}`
      : `${tailX},${tailY + 40} ${tailX + 30},${tailY} ${tailX - 30},${tailY}`;

    const bubbleBgColor = '#41a394aa'
    const textColor = '#00fffe'
    const fontFace = 'Titan One'
    const bubbleEdgeColor = '#00fffe'
    return (
      <g key={`bubble-${char.name}`} transform={`translate(${bubbleX} ${bubbleY})`}>
        {/* Bubble background */}
        <rect
          x={0}
          y={0}
          width={bubbleWidth}
          height={bubbleHeight}
          rx="15"
          ry="15"
          fill={bubbleBgColor}
          stroke={bubbleEdgeColor}
          strokeWidth="2"
        />
        {/* Bubble tail */}
        <polygon
          points={tailPoints}
          fill={bubbleBgColor}
          stroke={bubbleEdgeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Message text */}
        <text
          x={10}
          y={10}
          width={bubbleWidth}
          fill={textColor}
          fontSize="24"
          style={{
            fontFamily: fontFace,
            pointerEvents: 'none',
          }}
        >
          {message.split('\n').map((line, i) => (
            <tspan key={i} x={bubbleX + 15} dy={i === 0 ? '1.2em' : '1em'}>{line}</tspan>
          ))}
        </text>
      </g>
    );
}

const getCharacterDialogLines = (
  dialogs: DialogLine[],
  char: Character): DialogLine[] => {
  return dialogs.filter(dialog => dialog.name === char.name)
}

const SceneRenderer: React.FC<SceneRendererProps> = ({
  sceneData,
}) => {

  return (
    <SceneSVGWrapper
      sceneData={sceneData}
    >
      <SceneBackground sceneData={sceneData} />
      <SceneTitle sceneData={sceneData} />

      {/* Characters */}
      {sceneData.character?.map((char) => (
        <CharacterSvg key={`${char.name}`} char={char} dialogLines={getCharacterDialogLines(sceneData.dialog || [], char)}/>
      ))}
    </SceneSVGWrapper>
  );
};

const CharacterSvg = ({char, dialogLines}: {char: Character, dialogLines: DialogLine[]}) => {
  const translate = `${char.posX || 0 - (char.sizeX || 0)/2} ${char.posY || 0 - (char.sizeY || 0)/2}`
  return (
    <g
      key={`${char.name}`}
      transform={`translate(${translate})`}
      style={{
        transformOrigin: 'center',
      }}
    >

      <defs>
        <clipPath id={`character-clip-${char.name}`}>
          <rect
            x="0"
            y="0"
            width={char.sizeX}
            height={char.sizeY}
          />
        </clipPath>
      </defs>

      <image
        href={char.url}
        x="0"
        y="0"
        width={char.sizeX}
        height={char.sizeY}
        clipPath={`url(#character-clip-${char.name})`}
        preserveAspectRatio="xMidYMid meet"
      />

      <text
        x={(char.sizeX || 0)/2}
        y={char.sizeY}
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
        style={{
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          pointerEvents: 'none',
        }}
      >
        {char.name}
      </text>
      {/* Speech bubble */}
      {dialogLines.length > 0 && <SpeechBubble
        char={char}
        dialogLine={dialogLines[0]} />}
    </g>
  )
}

const SceneBackground = ({sceneData}: {sceneData: SceneData}) => {
  return (<>
    <defs>
    <pattern
        id="background-pattern"
        patternUnits="userSpaceOnUse"
        width={sceneData.width}
        height={sceneData.height}
      >
        <image
          href={sceneData.background}
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
        />
      </pattern>
    </defs>
    <rect
      width="100%"
      height="100%"
      fill="url(#background-pattern)"
    />
    </>
  )
}

const SceneTitle = ({sceneData}: {sceneData: SceneData}) => {
  return (
    <text
      x="50%"
      y="50"
      textAnchor="middle"
      fill="white"
      fontSize="32"
      fontWeight="bold"
      style={{
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
        pointerEvents: 'none',
      }}
    >
      {sceneData.scene}
    </text>
  )
}


export const SceneSVGWrapper = ({
    sceneData, children}: {
    sceneData: SceneData, children: React.ReactNode
  }) => {
  return (<svg
    width="100%"
    height="100%"
    viewBox={`0 0 ${sceneData.width} ${sceneData.height}`}
    preserveAspectRatio="xMidYMid meet"
    style={{
      backgroundColor: '#000',
      display: 'block',
      maxWidth: '100%',
      maxHeight: '100%',
    }}
  >

    {children}
  </svg>)
}



export default SceneRenderer;
