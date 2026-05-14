import React from 'react';
import { Rnd } from 'react-rnd';
import { PX_SCALE, BORDER_PX, INTERVAL, ENTITY_COLORS, ENTITY_TYPES } from '../../constants';

const EntityCanvas = ({
  entities,
  occluderPieces = [],
  worldWidth,
  worldHeight,
  targetDirection,
  ballSpeed,
  contextMenu,
  onEntityDragStop,
  onEntityResizeStop,
  onEntityContextMenu,
  onCanvasClick,
  onDeleteEntity,
  onUpdateTargetDirection,
  updateEntity,
  overlapRegions = [],
  selectedEntityId,
  onEntitySelect
}) => {
  const px_scale = PX_SCALE;
  const border_px = BORDER_PX;
  const interval = INTERVAL;

  const renderDirectionPreview = (target) => {
    if (target.type !== "target") return null;
  
    // Calculate the exact center using the same logic as the Rnd component
    const rndX = target.x * px_scale + border_px;
    const rndY = (worldHeight - target.y - target.height) * px_scale + border_px;
    const rndWidth = px_scale;
    const rndHeight = px_scale;
    
    // Center of the ball - exactly the same as the main Rnd component
    const centerX = rndX + rndWidth / 2;
    const centerY = rndY + rndHeight / 2;
  
    // Line end point - exactly ballSpeed * px_scale pixels from center in the direction
    const lineEndX = centerX + ballSpeed * px_scale * Math.cos(targetDirection);
    const lineEndY = centerY - ballSpeed * px_scale * Math.sin(targetDirection);

    const handleDragStop = (e, d) => {
      // Use the Rnd drag position for angle calculation, adjusted for canvas border
      const deltaX = (d.x + px_scale / 2) - centerX;
      const deltaY = centerY - (d.y + px_scale / 2);
      const preciseAngle = Math.atan2(deltaY, deltaX); 
    
      onUpdateTargetDirection(preciseAngle * (180 / Math.PI));
      
      const updatedEntity = {
        ...target,
        direction: preciseAngle,
      };
      updateEntity(target.id, updatedEntity);
    };
  
    return (
      <React.Fragment>
        {/* Line from ball center to end point */}
        <svg
          style={{
            position: "absolute",
            left: "0px",
            top: "0px",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10
          }}
        >
          <line
            x1={centerX - 3}
            y1={centerY - 3}
            x2={lineEndX - 3}
            y2={lineEndY - 3}
            stroke="#ef4444"
            strokeWidth="3"
          />
        </svg>
        
        {/* Blue preview at line end */}
        <Rnd
          size={{ width: px_scale, height: px_scale }}
          position={{
            x: lineEndX - px_scale / 2,
            y: lineEndY - px_scale / 2,
          }}
          bounds="parent"
          onDragStop={handleDragStop}
          enableResizing={false}
          style={{
            backgroundColor: "#3b82f6",
            borderRadius: "50%",
            cursor: "grab",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            zIndex: 20,
            opacity: 0.6
          }}
        />
      </React.Fragment>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: `${worldWidth * px_scale}px`,
        height: `${worldHeight * px_scale}px`,
        border: "3px solid #1e293b",
        borderRadius: "0px",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        backgroundColor: "#ffffff",
        colorScheme: "only light"
      }}
      onClick={onCanvasClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Derived occluder pieces (actual occluding geometry), rendered via Rnd for exact alignment */}
      {occluderPieces.map((occ, index) => (
        <Rnd
          key={`occ-piece-${index}`}
          size={{
            width: occ.width * px_scale,
            height: occ.height * px_scale,
          }}
          position={{
            x: occ.x * px_scale + border_px,
            y: (worldHeight - occ.y - occ.height) * px_scale + border_px,
          }}
          enableResizing={false}
          disableDragging
          style={{
            backgroundColor: ENTITY_COLORS.occluder,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      ))}

      {entities.map((entity) => (
        <React.Fragment key={entity.id}>
          <Rnd
            size={{
              width: entity.type === "target" ? px_scale : entity.width * px_scale,
              height: entity.type === "target" ? px_scale : entity.height * px_scale,
            }}
            position={{
              x: entity.x * px_scale + border_px,
              y: (worldHeight - entity.y - entity.height) * px_scale + border_px,
            }}
            minWidth={entity.type === "target" ? px_scale : interval * px_scale}
            minHeight={entity.type === "target" ? px_scale : interval * px_scale}
            onDrag={(e, d) => onEntityDragStop(entity, d)}
            onDragStop={(e, d) => onEntityDragStop(entity, d)}
            onResize={(e, direction, ref, delta, position) => onEntityResizeStop(entity, ref, position)}
            onResizeStop={(e, direction, ref, delta, position) => onEntityResizeStop(entity, ref, position)}
            bounds="parent"
            grid={[interval * px_scale, interval * px_scale]}
            enableResizing={entity.type !== "target"}
            style={{
              backgroundColor:
                entity.type === ENTITY_TYPES.WINDOW
                  ? "transparent"
                  : entity.type === ENTITY_TYPES.OCCLUDER
                  ? "transparent"
                  : ENTITY_COLORS[entity.type] || "#6b7280",
              borderRadius: entity.type === "target" ? "50%" : "0px",
              border:
                entity.type === ENTITY_TYPES.WINDOW
                  ? "1px solid #000000"
                  : entity.type === ENTITY_TYPES.OCCLUDER
                  ? "1px dashed rgba(15,23,42,0.6)"
                  : "0px solid black",
              outline: selectedEntityId === entity.id ? "2px solid #2563eb" : "none",
              outlineOffset: selectedEntityId === entity.id ? "2px" : "0px",
              cursor: "move",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onEntitySelect(entity.id);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEntitySelect(entity.id);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              onEntitySelect(entity.id);
              onEntityContextMenu(e, entity.id);
            }}
          />
          {entity.type === "target" && renderDirectionPreview(entity)}
        </React.Fragment>
      ))}
      {/* Overlap Highlight Regions */}
      {overlapRegions.map((overlap, index) => {
        // Convert world coordinates to canvas coordinates
        // Match exactly how Rnd positions entities:
        // Rnd position: x: entity.x * px_scale + border_px
        //               y: (worldHeight - entity.y - entity.height) * px_scale + border_px
        // Note: overlap.y is the bottom coordinate in world space (same as entity.y)
        // Adjust for grid snapping offset: subtract one grid interval (INTERVAL * px_scale) from both X and Y
        // This accounts for the step size between spatial domains for rectangular entities
        const gridOffset = interval * px_scale;
        const canvasX = overlap.x * px_scale + border_px - gridOffset;
        const canvasY = (worldHeight - overlap.y - overlap.height) * px_scale + border_px - gridOffset;
        const canvasWidth = overlap.width * px_scale;
        const canvasHeight = overlap.height * px_scale;
        
        return (
          <div
            key={`overlap-${index}`}
            style={{
              position: "absolute",
              left: `${canvasX}px`,
              top: `${canvasY}px`,
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              backgroundColor: "rgba(255, 107, 53, 0.4)", // Bright orange with transparency
              border: "none",
              borderRadius: "0px",
              pointerEvents: "none",
              zIndex: 15, // Above entities but below context menu
              boxShadow: "none",
              boxSizing: "border-box", // Match Rnd's box-sizing
              margin: 0,
              padding: 0
            }}
          />
        );
      })}
      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: "absolute",
            top: Math.min(contextMenu.y, worldHeight * px_scale - 50),
            left: Math.min(contextMenu.x, worldWidth * px_scale - 100),
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            zIndex: 1000,
            padding: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
        >
          <button
            onClick={() => onDeleteEntity(contextMenu.entityId)}
            style={{
              cursor: "pointer",
              width: "100%",
              padding: "8px 12px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default EntityCanvas;
