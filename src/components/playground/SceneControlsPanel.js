import React from 'react';

const SceneControlsPanel = ({ movementUnit, onMovementUnitChange, onRotateScene, onMirrorScene, hasEntities }) => {
  return (
    <div style={{ 
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", 
      padding: '24px', 
      borderRadius: '12px', 
      border: '1px solid #e2e8f0',
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    }}>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        fontSize: '18px', 
        fontWeight: '700', 
        color: '#1e293b',
        letterSpacing: '-0.025em'
      }}>
        Scene Controls
      </h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#374151', 
          marginBottom: '8px',
          letterSpacing: '0.025em'
        }}>
          Movement Unit
        </label>
        <input
          type="number"
          value={movementUnit}
          onChange={(e) => onMovementUnitChange(Number(e.target.value))}
          min="0.1"
          step="0.1"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
            backgroundColor: '#ffffff',
            color: '#1f2937'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = 'none';
          }}
        />
        <div style={{ 
          fontSize: '11px', 
          color: '#9ca3af', 
          marginTop: '6px' 
        }}>
          Use arrow keys to move all scene elements
        </div>
      </div>

      <div style={{ marginBottom: '0' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#374151', 
          marginBottom: '12px',
          letterSpacing: '0.025em'
        }}>
          Rotate Scene
        </label>
        <div style={{ 
          display: 'flex', 
          gap: '8px'
        }}>
          <button
            onClick={() => onRotateScene(false)}
            disabled={!hasEntities}
            style={{
              flex: 1,
              background: hasEntities 
                ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" 
                : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
              color: "white",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: hasEntities ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              opacity: hasEntities ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (hasEntities) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (hasEntities) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            ↺ Anticlockwise
          </button>
          <button
            onClick={() => onRotateScene(true)}
            disabled={!hasEntities}
            style={{
              flex: 1,
              background: hasEntities 
                ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" 
                : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
              color: "white",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: hasEntities ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              opacity: hasEntities ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (hasEntities) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (hasEntities) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            ↻ Clockwise
          </button>
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#9ca3af', 
          marginTop: '6px' 
        }}>
          Rotate all elements 90° about scene center
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#374151', 
          marginBottom: '12px',
          letterSpacing: '0.025em'
        }}>
          Mirror Scene
        </label>
        <div style={{ 
          display: 'flex', 
          gap: '8px'
        }}>
          <button
            onClick={() => onMirrorScene('horizontal')}
            disabled={!hasEntities}
            style={{
              flex: 1,
              background: hasEntities 
                ? "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" 
                : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
              color: "white",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: hasEntities ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              opacity: hasEntities ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (hasEntities) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (hasEntities) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            ↕ Mirror Horizontal
          </button>
          <button
            onClick={() => onMirrorScene('vertical')}
            disabled={!hasEntities}
            style={{
              flex: 1,
              background: hasEntities 
                ? "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" 
                : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
              color: "white",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: hasEntities ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              opacity: hasEntities ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (hasEntities) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (hasEntities) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            ↔ Mirror Vertical
          </button>
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#9ca3af', 
          marginTop: '6px' 
        }}>
          Mirror all elements across scene midlines
        </div>
      </div>
    </div>
  );
};

export default SceneControlsPanel;
