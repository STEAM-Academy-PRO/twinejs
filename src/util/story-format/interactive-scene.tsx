import React, { useState, useCallback } from 'react';
import { SceneData, Character } from './goose-parsers';
import SceneRenderer from './scene-renderer';
import { getCoordinateTransform, svgToDom } from './scene-editor-utils';

interface InteractiveSceneProps {
  sceneData: SceneData;
  onCharacterChange?: (index: number, character: Character) => void;
  selectedIndex?: number | null;
  onSelect?: (index: number | null) => void;
  isEditorMode?: boolean;
}

const RESIZE_HANDLE_SIZE = 8;
const SELECTION_STROKE_WIDTH = 2;

export const InteractiveScene: React.FC<InteractiveSceneProps> = ({
  sceneData,
  onCharacterChange,
  selectedIndex,
  onSelect,
}) => {
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize' | null;
    index: number;
    startX: number;
    startY: number;
    startChar: Character;
  } | null>(null);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number, type: 'move' | 'resize') => {
    const character = sceneData.character?.[index];
    if (!character) return;

    e.stopPropagation();
    onSelect?.(index);

    setDragState({
      type,
      index,
      startX: e.clientX,
      startY: e.clientY,
      startChar: { ...character },
    });
  }, [onSelect, sceneData.character]);

  const handleMouseMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState || !containerRef.current) return;

    const { type, index, startX, startY, startChar } = dragState;
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (!sceneData.character?.[index]) return;

    const updatedChar = { ...startChar };

    // Get coordinate transformation
    const transform = getCoordinateTransform(
      containerRef.current,
      sceneData.width || 1920,
      sceneData.height || 1080
    );

    if (type === 'move') {
      // Convert pixel movement to SVG coordinate movement
      const svgDx = dx / transform.scaleX;
      const svgDy = dy / transform.scaleY;

      updatedChar.posX = (startChar.posX || 0) + svgDx;
      updatedChar.posY = (startChar.posY || 0) + svgDy;
    } else if (type === 'resize') {
      // Convert pixel resize to SVG coordinate resize
      const svgDx = dx / transform.scaleX;
      const svgDy = dy / transform.scaleY;

      updatedChar.sizeX = Math.max(50, (startChar.sizeX || 100) + svgDx);
      updatedChar.sizeY = Math.max(50, (startChar.sizeY || 200) + svgDy);
    }

    onCharacterChange?.(index, updatedChar);
  }, [dragState, onCharacterChange, sceneData.character, sceneData.width, sceneData.height]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragState) {
        handleMouseMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragState) {
        handleMouseUp();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState, handleMouseMove, handleMouseUp]);

  const handleBackgroundClick = useCallback(() => {
    onSelect?.(null);
  }, [onSelect]);

  const handleCharacterMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, [dragState]);

  const handleCharacterMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, [dragState]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: dragState?.type === 'move' ? 'grabbing' : 'default',
      }}
      onClick={handleBackgroundClick}
    >
      <SceneRenderer sceneData={sceneData}/>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
      }}>
      {containerRef.current && sceneData.character?.map((char, index) => {
        const isSelected = selectedIndex === index;
        const isHovered = hoveredIndex === index;
        const showBorder = isSelected || isHovered;

        // Get coordinate transformation
        const transform = getCoordinateTransform(
          containerRef.current!,
          sceneData.width || 1920,
          sceneData.height || 1080
        );

        // Transform SVG coordinates to DOM coordinates
        const svgX = char.posX || 0;
        const svgY = char.posY || 0;
        const svgWidth = char.sizeX || 100;
        const svgHeight = char.sizeY || 200;

        const topLeft = svgToDom(svgX, svgY, transform);
        const bottomRight = svgToDom(svgX + svgWidth, svgY + svgHeight, transform);

        const x = topLeft.x;
        const y = topLeft.y;
        const charWidth = bottomRight.x - topLeft.x;
        const charHeight = bottomRight.y - topLeft.y;

        return (
          <React.Fragment key={`interactive-${index}`}>
            {/* Selection/hover border */}
            {showBorder && (
              <div
                style={{
                  position: 'absolute',
                  left: x - SELECTION_STROKE_WIDTH,
                  top: y - SELECTION_STROKE_WIDTH,
                  width: charWidth + (SELECTION_STROKE_WIDTH * 2),
                  height: charHeight + (SELECTION_STROKE_WIDTH * 2),
                  border: `${SELECTION_STROKE_WIDTH}px ${isSelected ? 'dashed' : 'solid'} ${isSelected ? '#00ffff' : '#ffff00'}`,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            )}

            {/* Move handle (entire character area) */}
            <div
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: charWidth,
                height: charHeight,
                cursor: isSelected ? 'move' : 'pointer',
                zIndex: 10,
              }}
              onMouseDown={(e) => handleMouseDown(e, index, 'move')}
              onMouseEnter={() => handleCharacterMouseEnter(index)}
              onMouseLeave={handleCharacterMouseLeave}
            />

            {/* Resize handle (bottom-right corner) */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  left: x + charWidth - (RESIZE_HANDLE_SIZE / 2),
                  top: y + charHeight - (RESIZE_HANDLE_SIZE / 2),
                  width: RESIZE_HANDLE_SIZE,
                  height: RESIZE_HANDLE_SIZE,
                  backgroundColor: '#00ffff',
                  border: '1px solid #000',
                  borderRadius: '2px',
                  cursor: 'nwse-resize',
                  zIndex: 11,
                }}
                onMouseDown={(e) => handleMouseDown(e, index, 'resize')}
              />
            )}
          </React.Fragment>
        );
      })}
      </div>
    </div>
  );
};

export default InteractiveScene;
