/**
 * Prepare init state data for saving
 * @param {Array} entities - Array of entities
 * @param {string} mode - Current mode
 * @param {Array} keyDistractors - Key distractors array
 * @param {Object} randomDistractorParams - Random distractor parameters
 * @param {Object} simulationParams - Simulation parameters
 * @returns {Object} Init state data object
 */
export const prepareInitStateData = (
  entities,
  mode,
  keyDistractors,
  randomDistractorParams,
  simulationParams
) => {
  const initStateData = {
    entities: entities,
    simulationParams: simulationParams
  };
  
  if (mode === 'distractor' && (keyDistractors.length > 0 || randomDistractorParams.probability > 0)) {
    initStateData.distractorData = {
      keyDistractors,
      randomDistractorParams
    };
  }
  
  return initStateData;
};

/**
 * Download a file as JSON
 * @param {Object} data - Data to download
 * @param {string} filename - Filename
 */
export const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse loaded file data
 * @param {Object|Array} parsedData - Parsed JSON data
 * @returns {{entities: Array, hasDistractorData: boolean, distractorData?: Object, simulationParams?: Object}}
 */
export const parseFileData = (parsedData) => {
  let parsedEntities;
  let hasDistractorData = false;
  let distractorData = null;
  let simulationParams = null;
  
  if (Array.isArray(parsedData)) {
    // Old format - just entities
    parsedEntities = parsedData;
  } else if (parsedData.entities) {
    // New format - entities + optional distractor data + optional simulation params
    parsedEntities = parsedData.entities;
    
    if (parsedData.simulationParams) {
      simulationParams = parsedData.simulationParams;
    }
    
    if (parsedData.distractorData || parsedData.hallucinationData) {
      hasDistractorData = true;
      // Handle both new and old key names for backward compatibility
      distractorData = parsedData.distractorData || parsedData.hallucinationData;
    }
  } else {
    throw new Error("Invalid file format. Ensure the JSON contains entities!");
  }
  
  if (!Array.isArray(parsedEntities)) {
    throw new Error("Invalid file format. Ensure the JSON contains an array of entities!");
  }
  
  return {
    entities: parsedEntities,
    hasDistractorData,
    distractorData,
    simulationParams
  };
};


/**
 * Create file load handler
 * @param {Object} params - Parameters object
 * @returns {Function} File load handler function
 */
export const createFileLoadHandler = ({
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
}) => {
  return async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Clear client-side simulation state before loading new scene data.
        // Scene loading should not hard-fail if backend clear endpoint is unavailable.
        setSimData(null);
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsedData = JSON.parse(e.target.result);
            const { entities: parsedEntities, hasDistractorData, distractorData, simulationParams } = parseFileData(parsedData);
            if (simulationParams) {
              if (simulationParams.videoLength !== undefined) setVideoLength(simulationParams.videoLength);
              if (simulationParams.ballSpeed !== undefined) setBallSpeed(simulationParams.ballSpeed);
              if (simulationParams.fps !== undefined) setFps(simulationParams.fps);
              if (simulationParams.worldWidth !== undefined) setWorldWidth(simulationParams.worldWidth);
              if (simulationParams.worldHeight !== undefined) setWorldHeight(simulationParams.worldHeight);
            }
            if (distractorData) {
              if (distractorData.keyDistractors || distractorData.keyHallucinations) {
                setKeyDistractors(distractorData.keyDistractors || distractorData.keyHallucinations);
              }
              if (distractorData.randomDistractorParams || distractorData.randomHallucinationParams) {
                setRandomDistractorParams(distractorData.randomDistractorParams || distractorData.randomHallucinationParams);
              }
            }
            setEntities(parsedEntities);
            const targetEntity = parsedEntities.find((entity) => entity.type === "target");
            if (targetEntity) {
              setTargetDirection(targetEntity.direction || 0);
              setDirectionInput(((targetEntity.direction || 0) * (180 / Math.PI)).toString());
            }
            if (hasDistractorData && mode === "regular") {
              setMode("distractor");
            } else if (!hasDistractorData && mode === "distractor") {
              setMode("regular");
              setKeyDistractors([]);
              setRandomDistractorParams(DEFAULT_RANDOM_DISTRACTOR_PARAMS);
            }
            setShouldAutoSimulate(true);
          } catch (err) {
            alert("Failed to parse file. Ensure it's a valid JSON format.");
          }
        };
        reader.readAsText(file);
      } catch (err) {
        console.error("Error loading file:", err);
        alert("An unexpected error occurred while loading the scene file.");
      }
    }
  };
};

/**
 * Create save directory handler
 * @param {Function} setSaveDirectoryHandle - Setter for save directory handle
 * @returns {Function} Save directory handler function
 */
export const createSetSaveDirectoryHandler = (setSaveDirectoryHandle) => {
  return async () => {
    if (!('showDirectoryPicker' in window)) {
      alert("Your browser doesn't support directory selection. When you save, files will be downloaded to your default downloads folder instead.");
      return;
    }
    try {
      const directoryHandle = await window.showDirectoryPicker();
      setSaveDirectoryHandle(directoryHandle);
      alert(`Save directory set to: ${directoryHandle.name}`);
    } catch (error) {
      if (error.name === 'AbortError') {
        alert("Directory selection was cancelled.");
      } else {
        console.error("Error selecting directory:", error);
        alert("An error occurred while selecting the directory.");
      }
    }
  };
};

/**
 * Create save data handler
 * @param {Object} params - Parameters object
 * @returns {Function} Save data handler function
 */
export const createSaveDataHandler = ({
  simData,
  entities,
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
}) => {
  return async () => {
    if (!simData) {
      alert("No simulation data available. Please run a simulation first!");
      return;
    }
    if (!saveDirectoryHandle) {
      try {
        const initStateData = prepareInitStateData(entities, mode, keyDistractors, randomDistractorParams, null);
        downloadJSON(initStateData, `${trial_name}_init_state_entities.json`);
        downloadJSON(simData, `${trial_name}_simulation_data.json`);
        if (autoDownloadWebM && videoPlayerRef && videoPlayerRef.current) {
          try {
            await videoPlayerRef.current.downloadWebM();
            alert("Files downloaded successfully!");
          } catch (error) {
            console.error("Error downloading video:", error);
            alert("Data files downloaded successfully, but video download failed!");
          }
        } else {
          alert("Files downloaded successfully!");
        }
      } catch (error) {
        console.error("Error downloading files:", error);
        alert("An error occurred while downloading files: " + error.message);
      }
      return;
    }
    try {
      let trialDirExists = false;
      let existingTrialDirHandle = null;
      try {
        existingTrialDirHandle = await saveDirectoryHandle.getDirectoryHandle(trial_name);
        trialDirExists = true;
      } catch (error) {
        trialDirExists = false;
      }
      if (trialDirExists) {
        const userConfirmed = window.confirm(`The trial directory "${trial_name}" already exists in the save directory. Do you want to override it?`);
        if (!userConfirmed) return;
        if (existingTrialDirHandle) {
          // Remove both WebM and MP4 files to handle format changes
          const extensions = ['webm', 'mp4'];
          const baseNames = [`${trial_name}`, `${trial_name}_stimulus`, `${trial_name}_revealed`];
          const filesToRemove = [];
          baseNames.forEach(base => {
            extensions.forEach(ext => {
              filesToRemove.push(`${base}.${ext}`);
            });
          });
          
          for (const filename of filesToRemove) {
            try {
              await existingTrialDirHandle.removeEntry(filename, { recursive: false });
              console.log(`Removed existing video file: ${filename}`);
            } catch (error) {
              // File doesn't exist, which is fine
              console.log(`No existing video file to remove (${filename}):`, error);
            }
          }
        }
      }
      const trialDirHandle = await saveDirectoryHandle.getDirectoryHandle(trial_name, { create: true });
      const simulationParams = { videoLength, ballSpeed, fps, worldWidth, worldHeight };
      const initStateData = prepareInitStateData(entities, mode, keyDistractors, randomDistractorParams, simulationParams);
      const entitiesFileHandle = await trialDirHandle.getFileHandle('init_state_entities.json', { create: true });
      const entitiesWritable = await entitiesFileHandle.createWritable();
      await entitiesWritable.write(JSON.stringify(initStateData, null, 2));
      await entitiesWritable.close();
      const simDataFileHandle = await trialDirHandle.getFileHandle('simulation_data.json', { create: true });
      const simDataWritable = await simDataFileHandle.createWritable();
      await simDataWritable.write(JSON.stringify(simData, null, 2));
      await simDataWritable.close();
      if (autoDownloadWebM && simData && videoPlayerRef && videoPlayerRef.current) {
        try {
          await videoPlayerRef.current.downloadWebM();
          alert("Data and video saved successfully!");
        } catch (error) {
          console.error("Error downloading video:", error);
          alert("Data saved successfully, but video download failed!");
        }
      } else {
        alert("Data saved successfully!");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        alert("Permission denied. Falling back to download files.");
        const simulationParams = { videoLength, ballSpeed, fps, worldWidth, worldHeight };
        const initStateData = prepareInitStateData(entities, mode, keyDistractors, randomDistractorParams, simulationParams);
        downloadJSON(initStateData, `${trial_name}_init_state_entities.json`);
        downloadJSON(simData, `${trial_name}_simulation_data.json`);
        alert("Files downloaded successfully!");
      } else {
        alert("An error occurred while saving data: " + error.message);
      }
    }
  };
};
