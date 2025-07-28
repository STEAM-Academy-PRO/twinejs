import React from 'react';

type Character = {
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

type DialogLine = {
  name: string;
  mood?: string;
  facing?: 'left' | 'right';
  message?: string;
};

type SceneData = {
  scene?: string;
  background?: string;
  character?: Character[];
  dialog?: DialogLine[];
};

interface SceneRendererProps {
  sceneData: SceneData;
  width?: number;
  height?: number;
}

const SpeechBubble: React.FC<{dialogLine: DialogLine, char: Character, index: number}> = ({dialogLine, char, index}) => {
    // Get the first dialog line for each character


  // Function to render a speech bubble
    const message = dialogLine.message;
    if (!message) return null;

    const bubbleWidth = 200;
    const bubbleHeight = 100;
    const charSizeX = Number(char.sizeX || 0);
    const charSizeY = Number(char.sizeY || 0);
    const isFacingLeft = char.facing === 'left';

    // Position bubble above character's head
    const bubbleX = isFacingLeft ? -bubbleWidth / 2 : charSizeX / 2 - bubbleWidth / 2;
    const bubbleY = -bubbleHeight - 20; // 20px above character

    // Tail position
    const tailX = isFacingLeft ? bubbleWidth * 0.25 : bubbleWidth * 0.75;
    const tailY = bubbleHeight;

    // Tail points (triangle)
    const tailPoints = isFacingLeft
      ? `${tailX},${tailY} ${tailX - 10},${tailY + 10} ${tailX + 10},${tailY + 10}`
      : `${tailX},${tailY} ${tailX - 10},${tailY + 10} ${tailX + 10},${tailY + 10}`;

    return (
      <g key={`bubble-${index}`}>
        {/* Bubble background */}
        <rect
          x={bubbleX}
          y={bubbleY}
          width={bubbleWidth}
          height={bubbleHeight}
          rx="15"
          ry="15"
          fill="white"
          stroke="#666"
          strokeWidth="2"
        />
        {/* Bubble tail */}
        <polygon
          points={tailPoints}
          fill="white"
          stroke="#666"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Message text */}
        <text
          x={bubbleX + 15}
          y={bubbleY + 25}
          width={bubbleWidth - 30}
          fill="#333"
          fontSize="14"
          style={{
            fontFamily: 'Arial, sans-serif',
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


const SceneRenderer: React.FC<SceneRendererProps> = ({
  sceneData,
  width = 1920,
  height = 1080,
}) => {
const characterDialogs = React.useMemo(() => {
    const dialogs = new Map<string, DialogLine>();
    sceneData.dialog?.forEach(dialog => {
        if (dialog.name && dialog.message && !dialogs.has(dialog.name)) {
        dialogs.set(dialog.name, dialog);
        }
    });
    return dialogs;
    }, [sceneData.dialog]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        backgroundColor: '#000',
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      {/* Background */}
      <defs>
        <pattern
          id="background-pattern"
          patternUnits="userSpaceOnUse"
          width={width}
          height={height}
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

      <rect width="100%" height="100%" fill="url(#background-pattern)" />

      {/* Scene Title */}
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

      {/* Characters */}
      {sceneData.character?.map((char, index) => (
        <g
          key={`${char.name}-${index}`}
          transform={`translate(${char.posX} ${char.posY}) ${char.facing === 'left' ? 'scale(-1, 1)' : ''}`}
          style={{
            transformOrigin: 'center',
          }}
        >
          {/* Speech bubble */}
          {characterDialogs.has(char.name || '') && <SpeechBubble 
            char={char} 
            index={index} 
            dialogLine={characterDialogs.get(char.name || '') || {}} />}

          <defs>
            <clipPath id={`character-clip-${index}`}>
              <rect
                x={char.facing === 'left' ? -Number(char.sizeX || 0) : 0}
                y="0"
                width={char.sizeX}
                height={char.sizeY}
              />
            </clipPath>
          </defs>

          <image
            href={char.url}
            x={char.facing === 'left' ? -Number(char.sizeX || 0) : 0}
            y="0"
            width={char.sizeX}
            height={char.sizeY}
            clipPath={`url(#character-clip-${index})`}
            preserveAspectRatio="xMidYMid meet"
          />

          <text
            x={Number(char.sizeX || 0) / 2}
            y={-10}
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
        </g>
      ))}
    </svg>
  );
};

export default SceneRenderer;
