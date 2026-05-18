import React, { useState, useRef, useEffect } from "react";
import VideoPlayer from "./components/VideoPlayer";
import NavigationBar from "./components/playground/NavigationBar";
import SimulationSettingsPanel from "./components/playground/SimulationSettingsPanel";
import SceneControlsPanel from "./components/playground/SceneControlsPanel";
import SelectedEntityPanel from "./components/playground/SelectedEntityPanel";
import TrajectoryScrubPanel from "./components/playground/TrajectoryScrubPanel";
import OcclusionPresetsPanel from "./components/playground/OcclusionPresetsPanel";
import DistractorControlsPanel from "./components/playground/DistractorControlsPanel";
import EntityCanvas from "./components/playground/EntityCanvas";
import ControlBar from "./components/playground/ControlBar";
import { useEntities } from "./hooks/useEntities";
import { useDistractors } from "./hooks/useDistractors";
import { useSimulation } from "./hooks/useSimulation";
import { usePhysics } from "./hooks/usePhysics";
import { useTargetDirection } from "./hooks/useTargetDirection";
import { useSceneTransform } from "./hooks/useSceneTransform";
import { createFileLoadHandler, createSetSaveDirectoryHandler, createSaveDataHandler } from "./utils/fileUtils";
import { validateEntityOverlaps } from "./utils/collisionUtils";
import { getEntitiesWithWindowsApplied } from "./utils/occluderUtils";
import { DEFAULT_RANDOM_DISTRACTOR_PARAMS, VID_RES, PX_SCALE, INTERVAL, BORDER_PX, RES_MULTIPLIER } from "./constants";

function App() {
  const videoPlayerRef = useRef(null);
  const handleSimulateRef = useRef(null);

  // Simulation parameters
  const [videoLength, setVideoLength] = useState(10);
  const [ballSpeed, setBallSpeed] = useState(3.6);
  const [fps, setFps] = useState(30);
  const [worldWidth, setWorldWidth] = useState(20);
  const [worldHeight, setWorldHeight] = useState(20);
  const res_multiplier = RES_MULTIPLIER;

  // Physics calculations
  const physics = usePhysics(ballSpeed, fps);
  const { physicsStepsPerFrame, timestep, isValid: isValidPhysics, warning: physicsWarning, ballMovementPerFrame } = physics;

  // Saving and Loading params
  const [trial_name, setTrial_name] = useState('base');
  const [saveDirectoryHandle, setSaveDirectoryHandle] = useState(null);
  const [autoDownloadWebM, setAutoDownloadWebM] = useState(true);
  const [videoFormat, setVideoFormat] = useState('webm'); // 'webm' or 'mp4'

  // Scene transformation controls
  const [movementUnit, setMovementUnit] = useState(1.0);

  // Strict occlusion mode (default: true)
  const [strictOcclusionMode, setStrictOcclusionMode] = useState(true);

  // Occlusion presets for this session (occluders + windows only)
  const [occlusionPresets, setOcclusionPresets] = useState([]);

  // Trajectory scrub state
  const [scrubEnabled, setScrubEnabled] = useState(false);
  const [scrubFrame, setScrubFrame] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState(null);

  // Use hooks for state management
  const entitiesHook = useEntities(worldWidth, worldHeight);
  const { entities, setEntities, contextMenu, setContextMenu, addEntity: addEntityBase, updateEntity, deleteEntity, clearAllEntities, handleContextMenu } = entitiesHook;

  const distractorsHook = useDistractors();
  const { mode, setMode, keyDistractors, setKeyDistractors, randomDistractorParams, setRandomDistractorParams, isAddingKeyDistractor, setIsAddingKeyDistractor, editingDistractorIndex, setEditingDistractorIndex, selectedFrame, setSelectedFrame, resetDistractorParams } = distractorsHook;

  const simulationHook = useSimulation();
  const { simData, setSimData, shouldAutoSimulate, setShouldAutoSimulate, handleSimulate: handleSimulateBase } = simulationHook;

  const targetDirectionHook = useTargetDirection(entities, updateEntity);
  const { targetDirection, setTargetDirection, directionInput, setDirectionInput, updateTargetDirection, handleDirectionInputChange } = targetDirectionHook;

  const sceneTransformHook = useSceneTransform(entities, setEntities, worldWidth, worldHeight, movementUnit, setTargetDirection, setDirectionInput);
  const { moveScene, rotateScene } = sceneTransformHook;
  const selectedEntity = entities.find((entity) => entity.id === selectedEntityId) || null;

  // Keyboard event listener for arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        moveScene(e.key);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEntityId !== null) {
        e.preventDefault();
        deleteEntity(selectedEntityId);
        setSelectedEntityId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveScene, selectedEntityId, deleteEntity]);

  useEffect(() => {
    if (selectedEntityId === null) {
      return;
    }
    const selectedStillExists = entities.some((entity) => entity.id === selectedEntityId);
    if (!selectedStillExists) {
      setSelectedEntityId(null);
    }
  }, [entities, selectedEntityId]);

  // Derive effective occluders after applying windows, and validate overlaps against that.
  const { entitiesForSimulation, occluderPieces } = getEntitiesWithWindowsApplied(entities);
  const overlapValidation = validateEntityOverlaps(entitiesForSimulation, strictOcclusionMode);

  // Auto-simulate when keyDistractors change
  useEffect(() => {
    if (shouldAutoSimulate && entities.length > 0) {
      handleSimulate(true);
      setShouldAutoSimulate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyDistractors, shouldAutoSimulate, entities]);

  // Wrapper for addEntity to handle target direction initialization
  const addEntity = (type) => {
    addEntityBase(type, () => {
      if (type === "target") {
        setDirectionInput("0");
        setTargetDirection(0);
      }
    });
  };

  // Wrapper for clearAllEntities to also clear simData and distractor data
  const handleClearAll = () => {
    clearAllEntities();
    setSelectedEntityId(null);
    setSimData(null);
    resetDistractorParams();
  };

  // Wrapper for handleSimulate
  const handleSimulate = (autoRun = false) => {
    // Check for overlaps before simulating
    if (!overlapValidation.valid) {
      if (!autoRun) {
        alert(overlapValidation.message);
      }
      return;
    }

    const simulationParams = {
      videoLength,
      ballSpeed,
      fps,
      physicsStepsPerFrame,
      res_multiplier,
      timestep,
      worldWidth,
      worldHeight
    };
    // Reset scrub UI when starting a fresh simulation
    setScrubEnabled(false);
    setScrubFrame(0);
    handleSimulateBase(entitiesForSimulation, simulationParams, mode, keyDistractors, randomDistractorParams, autoRun);
  };
  handleSimulateRef.current = handleSimulate;

  useEffect(() => {
    const onKeyDown = (e) => {
      const isEnterKey =
        e.key === "Enter" ||
        e.key === "Return" ||
        e.code === "Enter" ||
        e.code === "NumpadEnter";
      const hasShortcutModifier = e.metaKey || e.ctrlKey;

      if (!isEnterKey || !hasShortcutModifier || e.isComposing) {
        return;
      }
      if (!(isValidPhysics && overlapValidation.valid)) {
        return;
      }
      e.preventDefault();
      handleSimulateRef.current?.(false);
    };
    // Capture phase makes shortcut more reliable when focused controls stop bubbling.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isValidPhysics, overlapValidation.valid]);

  // File operation handlers
  const handleFileLoad = createFileLoadHandler({
    setSimData,
    setEntities,
    setVideoLength,
    setBallSpeed,
    setFps,
    setWorldWidth,
    setWorldHeight,
    setKeyDistractors,
    setRandomDistractorParams,
    setMode,
    setTargetDirection,
    setDirectionInput,
    setShouldAutoSimulate,
    mode,
    DEFAULT_RANDOM_DISTRACTOR_PARAMS
  });

  const handleSetSaveDirectory = createSetSaveDirectoryHandler(setSaveDirectoryHandle);

  const handleSavedata = createSaveDataHandler({
    simData,
    entities: entitiesForSimulation,
    mode,
    keyDistractors,
    randomDistractorParams,
    videoLength,
    ballSpeed,
    fps,
    worldWidth,
    worldHeight,
    trial_name,
    saveDirectoryHandle,
    autoDownloadWebM,
    videoFormat,
    videoPlayerRef
  });

  // Entity canvas handlers
  const updateEntityFromDrag = (entity, d) => {
    const px_scale = PX_SCALE;
    const border_px = BORDER_PX;
    const interval = INTERVAL;
    const snappedX = Math.round((d.x - border_px) / (interval * px_scale)) * interval;
    const snappedY = Math.round(
      (worldHeight - ((d.y - border_px) / px_scale + entity.height)) / interval
    ) * interval;

    const updatedEntity = {
      ...entity,
      x: Math.max(0, Math.min(snappedX, worldWidth - entity.width)),
      y: Math.max(0, Math.min(snappedY, worldHeight - entity.height)),
    };
    
    updateEntity(entity.id, updatedEntity);

    // Update target direction if it's a target
    if (entity.type === "target") {
      setTargetDirection(updatedEntity.direction || 0);
      setDirectionInput(((updatedEntity.direction || 0) * (180 / Math.PI)).toString());
    }
  };

  const handleEntityDragStop = (entity, d) => {
    updateEntityFromDrag(entity, d);
  };

  const updateEntityFromResize = (entity, ref, position) => {
    if (entity.type === "target") return;
    
    const px_scale = PX_SCALE;
    const border_px = BORDER_PX;
    const interval = INTERVAL;
    const snappedX = Math.round((position.x - border_px) / (interval * px_scale)) * interval;
    const snappedY = Math.round(
      (worldHeight -
        ((position.y - border_px) / px_scale + parseFloat(ref.style.height) / px_scale)) /
      interval
    ) * interval;

    const snappedWidth = Math.round(parseFloat(ref.style.width) / (interval * px_scale)) * interval;
    const snappedHeight = Math.round(parseFloat(ref.style.height) / (interval * px_scale)) * interval;

    const updatedEntity = {
      ...entity,
      x: Math.max(0, Math.min(snappedX, worldWidth - snappedWidth)),
      y: Math.max(0, Math.min(snappedY, worldHeight - snappedHeight)),
      width: snappedWidth,
      height: snappedHeight,
    };
    
    updateEntity(entity.id, updatedEntity);
  };

  const handleEntityResizeStop = (entity, ref, position) => {
    updateEntityFromResize(entity, ref, position);
  };

  // Occlusion preset handlers (session-only)
  const handleAddOcclusionPreset = () => {
    const occlusionEntities = entities.filter(
      (e) => e.type === "occluder" || e.type === "window"
    );
    if (occlusionEntities.length === 0) {
      alert("No occluders or windows to save in a preset.");
      return;
    }
    const defaultName = `Preset ${occlusionPresets.length + 1}`;
    const name = window.prompt("Name this occlusion preset:", defaultName);
    if (!name) return;
    const preset = {
      id: Date.now().toString(),
      name,
      occlusionEntities: occlusionEntities.map((e) => ({ ...e })),
    };
    setOcclusionPresets((prev) => [...prev, preset]);
  };

  const handleLoadOcclusionPreset = (presetId) => {
    const preset = occlusionPresets.find((p) => p.id === presetId);
    if (!preset) return;
    const confirmed = window.confirm(
      `Load occlusion preset "${preset.name}"? This will replace current occluders and windows and run a new simulation.`
    );
    if (!confirmed) return;

    const nonOcclusionEntities = entities.filter(
      (e) => e.type !== "occluder" && e.type !== "window"
    );
    const newEntities = [...nonOcclusionEntities, ...preset.occlusionEntities.map((e) => ({ ...e }))];
    setEntities(newEntities);
    setShouldAutoSimulate(true);
  };

  const handleDeleteOcclusionPreset = (presetId) => {
    setOcclusionPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  // Trajectory scrub helpers
  const applyScrubFrameToTarget = (frameIndex) => {
    if (!simData || !simData.step_data) return;
    const step = simData.step_data[frameIndex];
    if (!step) return;
    const { x, y, dir } = step;
    setEntities((prev) =>
      prev.map((e) =>
        e.type === "target"
          ? {
              ...e,
              x,
              y,
              direction: dir,
            }
          : e
      )
    );
    if (dir !== undefined) {
      setTargetDirection(dir);
      setDirectionInput(((dir || 0) * (180 / Math.PI)).toString());
    }
    // Also sync selected frame used by VideoPlayer / distractor editor
    setSelectedFrame(frameIndex);
  };

  const handleToggleScrubEnabled = (enabled) => {
    setScrubEnabled(enabled);
    if (enabled && simData && simData.step_data) {
      const initialFrame = scrubFrame ?? 0;
      applyScrubFrameToTarget(initialFrame);
    }
  };

  const handleScrubFrameChange = (frameIndex) => {
    setScrubFrame(frameIndex);
    if (scrubEnabled) {
      applyScrubFrameToTarget(frameIndex);
    }
  };

  const handleCanvasClick = () => {
    setContextMenu({ visible: false, x: 0, y: 0, entityId: null });
    setSelectedEntityId(null);
  };

  const handleDeleteEntity = (id) => {
    deleteEntity(id);
    if (id === selectedEntityId) {
      setSelectedEntityId(null);
    }
  };

  const handleSelectedEntityFieldChange = (field, value) => {
    if (!selectedEntity) return;
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return;

    if (field === "directionDegrees" && selectedEntity.type === "target") {
      handleUpdateTargetDirection(numericValue);
      return;
    }

    const nextEntity = { ...selectedEntity };

    if (field === "width" && selectedEntity.type !== "target") {
      nextEntity.width = Math.max(INTERVAL, numericValue);
    } else if (field === "height" && selectedEntity.type !== "target") {
      nextEntity.height = Math.max(INTERVAL, numericValue);
    } else if (field === "x" || field === "y") {
      nextEntity[field] = numericValue;
    } else {
      return;
    }

    nextEntity.x = Math.max(0, Math.min(nextEntity.x, worldWidth - nextEntity.width));
    nextEntity.y = Math.max(0, Math.min(nextEntity.y, worldHeight - nextEntity.height));

    updateEntity(selectedEntity.id, nextEntity);
  };

  const handleUpdateTargetDirection = (angleDegrees) => {
    updateTargetDirection(angleDegrees);
  };

  // Distractor handlers
  const handleEditDistractor = (index) => {
    setEditingDistractorIndex(index);
    setIsAddingKeyDistractor(true);
  };

  const handleDeleteDistractor = (index) => {
    setKeyDistractors(keyDistractors.filter((_, i) => i !== index));
    if (editingDistractorIndex === index) {
      setEditingDistractorIndex(null);
      setIsAddingKeyDistractor(false);
    }
  };

  const handleAddKeyDistractor = (distractorData) => {
    if (editingDistractorIndex !== null) {
      const updated = [...keyDistractors];
      updated[editingDistractorIndex] = distractorData;
      setKeyDistractors(updated);
      setEditingDistractorIndex(null);
    } else {
      setKeyDistractors([...keyDistractors, distractorData]);
    }
    setIsAddingKeyDistractor(false);
    setShouldAutoSimulate(true);
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh",
      overflow: "hidden",
      backgroundColor: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    }}>
      {/* Top Bar with Navigation and Mode Switcher */}
      <NavigationBar mode={mode} setMode={setMode} />

      {/* Middle Section - Canvas and Video Player */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "row", 
        alignItems: "flex-start", 
        gap: "24px",
        padding: "24px",
        overflow: "hidden"
      }}>
        {/* Left Side - Simulation Settings */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "20px",
          maxWidth: "300px",
          flexShrink: 0,
          height: "100%",
          overflowY: "auto",
          paddingRight: "4px"
        }}>
          <SimulationSettingsPanel
            videoLength={videoLength}
            ballSpeed={ballSpeed}
            fps={fps}
            worldWidth={worldWidth}
            worldHeight={worldHeight}
            directionInput={directionInput}
            onVideoLengthChange={setVideoLength}
            onBallSpeedChange={setBallSpeed}
            onFpsChange={setFps}
            onWorldWidthChange={setWorldWidth}
            onWorldHeightChange={setWorldHeight}
            onDirectionInputChange={handleDirectionInputChange}
            physicsWarning={physicsWarning}
            ballMovementPerFrame={ballMovementPerFrame}
            strictOcclusionMode={strictOcclusionMode}
            onStrictOcclusionModeChange={setStrictOcclusionMode}
          />

          <SceneControlsPanel
            movementUnit={movementUnit}
            onMovementUnitChange={setMovementUnit}
            onRotateScene={rotateScene}
            hasEntities={entities.length > 0}
          />

          <SelectedEntityPanel
            selectedEntity={selectedEntity}
            onChangeField={handleSelectedEntityFieldChange}
            onDeleteEntity={handleDeleteEntity}
          />

          <TrajectoryScrubPanel
            enabled={scrubEnabled}
            onToggleEnabled={handleToggleScrubEnabled}
            simData={simData}
            scrubFrame={scrubFrame}
            onScrubFrameChange={handleScrubFrameChange}
          />

          <OcclusionPresetsPanel
            presets={occlusionPresets}
            onAddPreset={handleAddOcclusionPreset}
            onLoadPreset={handleLoadOcclusionPreset}
            onDeletePreset={handleDeleteOcclusionPreset}
            hasOcclusion={entities.some(e => e.type === "occluder" || e.type === "window")}
          />

          {mode === "distractor" && (
            <DistractorControlsPanel
              simData={simData}
              isAddingKeyDistractor={isAddingKeyDistractor}
              setIsAddingKeyDistractor={setIsAddingKeyDistractor}
              keyDistractors={keyDistractors}
              editingDistractorIndex={editingDistractorIndex}
              onEditDistractor={handleEditDistractor}
              onDeleteDistractor={handleDeleteDistractor}
              randomDistractorParams={randomDistractorParams}
              onRandomDistractorParamsChange={setRandomDistractorParams}
              onShouldAutoSimulate={setShouldAutoSimulate}
            />
          )}
        </div>

        {/* Right Side - Canvas and Video Player */}
        <div style={{ 
          display: "flex", 
          flexDirection: "row", 
          gap: "24px",
          flex: 1,
          justifyContent: "flex-start"
        }}>
          <EntityCanvas
            entities={entities}
            occluderPieces={occluderPieces}
            worldWidth={worldWidth}
            worldHeight={worldHeight}
            targetDirection={targetDirection}
            ballSpeed={ballSpeed}
            contextMenu={contextMenu}
            onEntityDragStop={handleEntityDragStop}
            onEntityResizeStop={handleEntityResizeStop}
            onEntityContextMenu={handleContextMenu}
            onCanvasClick={handleCanvasClick}
            onDeleteEntity={handleDeleteEntity}
            onUpdateTargetDirection={handleUpdateTargetDirection}
            updateEntity={updateEntity}
            overlapRegions={overlapValidation.overlapRegions}
            selectedEntityId={selectedEntityId}
            onEntitySelect={setSelectedEntityId}
          />

          {/* Video Player Section */}
          <div style={{ 
            flexShrink: 0,
            borderRadius: "0px",
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          }}>
            {simData ? (
              <VideoPlayer 
                simData={simData} 
                fps={fps} 
                trial_name={trial_name}
                saveDirectoryHandle={saveDirectoryHandle}
                worldWidth={worldWidth}
                worldHeight={worldHeight}
                mode={mode}
                isAddingKeyDistractor={isAddingKeyDistractor}
                setIsAddingKeyDistractor={setIsAddingKeyDistractor}
                selectedFrame={selectedFrame}
                setSelectedFrame={setSelectedFrame}
                keyDistractors={keyDistractors}
                editingDistractorIndex={editingDistractorIndex}
                onAddKeyDistractor={handleAddKeyDistractor}
                videoFormat={videoFormat}
                ref={videoPlayerRef}
              />
            ) : (
              <div
                style={{
                  width: `${VID_RES}px`,
                  height: `${VID_RES}px`,
                  border: "3px solid #1e293b",
                  borderRadius: "0px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8fafc",
                  color: "#6b7280",
                  fontSize: "16px",
                  fontWeight: "500"
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📹</div>
                  <p style={{ margin: 0 }}>No simulation data available</p>
                  <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.7 }}>Run a simulation first</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - All Controls and Buttons */}
      <ControlBar
        onAddEntity={addEntity}
        onSimulate={handleSimulate}
        isValidPhysics={isValidPhysics && overlapValidation.valid}
        overlapWarning={!overlapValidation.valid ? overlapValidation.message : null}
        trial_name={trial_name}
        onTrialNameChange={setTrial_name}
        saveDirectoryHandle={saveDirectoryHandle}
        onSetSaveDirectory={handleSetSaveDirectory}
        autoDownloadWebM={autoDownloadWebM}
        onAutoDownloadWebMChange={setAutoDownloadWebM}
        videoFormat={videoFormat}
        onVideoFormatChange={setVideoFormat}
        onSaveData={handleSavedata}
        onFileLoad={handleFileLoad}
        onClearAll={handleClearAll}
      />
    </div>
  );
}

export default App;
