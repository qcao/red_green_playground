import React from 'react';
import { ENTITY_TYPES } from '../../constants';

const ControlBar = ({
  onAddEntity,
  onSimulate,
  isValidPhysics,
  overlapWarning,
  trial_name,
  onTrialNameChange,
  saveDirectoryHandle,
  onSetSaveDirectory,
  autoDownloadWebM,
  onAutoDownloadWebMChange,
  videoFormat,
  onVideoFormatChange,
  onSaveData,
  onFileLoad,
  onClearAll
}) => {
  return (
    <div style={{ 
      background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", 
      borderTop: "1px solid #475569",
      padding: "16px 24px",
      boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)"
    }}>
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "12px", 
        alignItems: "center",
        justifyContent: "flex-start"
      }}>
        {/* Entity Buttons */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          marginRight: "20px",
          paddingRight: "20px",
          borderRight: "1px solid #475569"
        }}>
          <button
            onClick={() => onAddEntity(ENTITY_TYPES.OCCLUDER)}
            style={{ 
              background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)", 
              color: "white", 
              padding: "8px 14px", 
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            Add Occluder
          </button>
          <button
            onClick={() => onAddEntity(ENTITY_TYPES.WINDOW)}
            style={{ 
              background: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)", 
              color: "#111827", 
              padding: "8px 14px", 
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            Add Window
          </button>
          <button
            onClick={() => onAddEntity(ENTITY_TYPES.BARRIER)}
            style={{ 
              background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)", 
              color: "white", 
              padding: "8px 14px", 
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            Add Barrier
          </button>
          <button
            onClick={() => onAddEntity(ENTITY_TYPES.RED_SENSOR)}
            style={{ 
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", 
              color: "white", 
              padding: "8px 14px", 
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            Add Red Sensor
          </button>
          <button
            onClick={() => onAddEntity(ENTITY_TYPES.GREEN_SENSOR)}
            style={{ 
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
              color: "white", 
              padding: "8px 14px", 
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            Add Green Sensor
          </button>
          <button
            onClick={() => onAddEntity(ENTITY_TYPES.TARGET)}
            style={{ 
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", 
              color: "white", 
              padding: "8px 14px", 
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            Add Target
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          marginRight: "20px",
          paddingRight: "20px",
          borderRight: "1px solid #475569"
        }}>
          <button
            onClick={onSimulate}
            disabled={!isValidPhysics}
            style={{
              background: isValidPhysics ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
              color: "white",
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: isValidPhysics ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              if (isValidPhysics) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (isValidPhysics) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }
            }}
            title={
              overlapWarning
                ? `${overlapWarning} — Keyboard: ⌘+Enter or Ctrl+Enter when scene is valid.`
                : "Keyboard: ⌘+Enter (Mac) or Ctrl+Enter (Windows/Linux) to simulate"
            }
          >
            {isValidPhysics ? "🚀 Simulate" : (overlapWarning ? "⚠️ Overlaps Detected" : "Invalid Physics")}
          </button>
        </div>

        {/* Trial Settings */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          alignItems: "center",
          marginRight: "20px",
          paddingRight: "20px",
          borderRight: "1px solid #475569"
        }}>
          <label style={{ 
            fontSize: "12px", 
            fontWeight: "600", 
            color: "#e2e8f0"
          }}>
            Trial Name:
          </label>
          <input
            type="text"
            value={trial_name}
            onChange={(e) => onTrialNameChange(e.target.value)}
            style={{
              padding: "6px 10px",
              border: "2px solid #475569",
              borderRadius: "4px",
              fontSize: "12px",
              outline: "none",
              transition: "all 0.2s ease",
              width: "100px",
              backgroundColor: "#1e293b",
              color: "#f1f5f9",
              fontWeight: "500"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#475569";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Save Controls */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          alignItems: "center",
          marginRight: "20px",
          paddingRight: "20px",
          borderRight: "1px solid #475569"
        }}>
          <button
            onClick={onSetSaveDirectory}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white",
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            📁 Select Save Directory
          </button>
          {saveDirectoryHandle && (
            <div style={{
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              color: "#e2e8f0",
              padding: "6px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "500",
              border: "1px solid #475569",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              maxWidth: "160px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              📂 {saveDirectoryHandle.name}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ fontSize: "12px", color: "#e2e8f0", margin: 0, fontWeight: "600", marginRight: "4px" }}>
                  Format:
                </label>
                <select
                  value={videoFormat}
                  onChange={(e) => {
                    const newFormat = e.target.value;
                    if (newFormat === 'mp4') {
                      const confirmed = window.confirm(
                        'MP4 format requires server-side conversion from WebM, which will take longer. Continue?'
                      );
                      if (confirmed) {
                        onVideoFormatChange(newFormat);
                      } else {
                        // Reset to WebM if user cancels
                        e.target.value = 'webm';
                      }
                    } else {
                      onVideoFormatChange(newFormat);
                    }
                  }}
                  style={{
                    padding: "4px 8px",
                    border: "2px solid #475569",
                    borderRadius: "4px",
                    fontSize: "12px",
                    outline: "none",
                    backgroundColor: "#1e293b",
                    color: "#f1f5f9",
                    fontWeight: "500",
                    cursor: "pointer"
                  }}
                >
                  <option value="webm">WebM</option>
                  <option value="mp4">MP4</option>
                </select>
              </div>
              {videoFormat === 'mp4' && (
                <div style={{
                  fontSize: "10px",
                  color: "#fbbf24",
                  fontStyle: "italic",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginLeft: "60px"
                }}>
                  ⚠️ MP4 conversion takes ~15-20 seconds
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={autoDownloadWebM}
                onChange={(e) => onAutoDownloadWebMChange(e.target.checked)}
                style={{ 
                  margin: 0,
                  width: "14px",
                  height: "14px",
                  accentColor: "#3b82f6"
                }}
              />
              <label style={{ fontSize: "12px", color: "#e2e8f0", margin: 0, fontWeight: "500" }}>
                Auto-download Video
              </label>
            </div>
          </div>
          <button
            onClick={onSaveData}
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white",
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            💾 Save Data
          </button>
        </div>

        {/* File Controls */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          alignItems: "center"
        }}>
          <label
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              margin: 0,
              border: "none",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              display: "inline-block"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            📂 Load Scene
            <input
              type="file"
              accept=".json"
              onChange={onFileLoad}
              style={{ display: "none" }}
            />
          </label>
          <button
            onClick={onClearAll}
            style={{
              background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
              color: "white",
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            }}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
