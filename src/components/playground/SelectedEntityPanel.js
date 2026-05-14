import React, { useEffect, useState } from 'react';
import { ENTITY_TYPES } from '../../constants';

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '2px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '12px',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  color: '#1f2937'
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '6px'
};

const SelectedEntityPanel = ({ selectedEntity, onChangeField, onDeleteEntity }) => {
  const [draftValues, setDraftValues] = useState({
    x: '',
    y: '',
    width: '',
    height: '',
    directionDegrees: ''
  });

  useEffect(() => {
    if (!selectedEntity) {
      setDraftValues({
        x: '',
        y: '',
        width: '',
        height: '',
        directionDegrees: ''
      });
      return;
    }

    setDraftValues({
      x: String(selectedEntity.x),
      y: String(selectedEntity.y),
      width: String(selectedEntity.width),
      height: String(selectedEntity.height),
      directionDegrees: ((selectedEntity.direction || 0) * (180 / Math.PI)).toFixed(2)
    });
  }, [selectedEntity]);

  const handleInputChange = (field, rawValue) => {
    setDraftValues((prev) => ({
      ...prev,
      [field]: rawValue
    }));

    if (rawValue === '') {
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    onChangeField(field, rawValue);
  };

  const handleInputBlur = (field) => {
    if (!selectedEntity) return;
    if (draftValues[field] !== '') return;

    const resetValue = field === 'directionDegrees'
      ? ((selectedEntity.direction || 0) * (180 / Math.PI)).toFixed(2)
      : String(selectedEntity[field] ?? '');

    setDraftValues((prev) => ({
      ...prev,
      [field]: resetValue
    }));
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <h3
        style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          letterSpacing: '-0.025em'
        }}
      >
        Selected Object
      </h3>

      {!selectedEntity ? (
        <div
          style={{
            fontSize: '13px',
            color: '#6b7280',
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '14px'
          }}
        >
          Click an object on the canvas to edit its numeric parameters.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '14px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            Type: {selectedEntity.type}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>x</label>
              <input
                type="number"
                step="0.01"
                value={draftValues.x}
                onChange={(e) => handleInputChange('x', e.target.value)}
                onBlur={() => handleInputBlur('x')}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>y</label>
              <input
                type="number"
                step="0.01"
                value={draftValues.y}
                onChange={(e) => handleInputChange('y', e.target.value)}
                onBlur={() => handleInputBlur('y')}
                style={inputStyle}
              />
            </div>
          </div>

          {selectedEntity.type !== ENTITY_TYPES.TARGET && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>width</label>
                <input
                  type="number"
                  step="0.01"
                  value={draftValues.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  onBlur={() => handleInputBlur('width')}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>height</label>
                <input
                  type="number"
                  step="0.01"
                  value={draftValues.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  onBlur={() => handleInputBlur('height')}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {selectedEntity.type === ENTITY_TYPES.TARGET && (
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>direction (degrees)</label>
              <input
                type="number"
                step="0.1"
                value={draftValues.directionDegrees}
                onChange={(e) => handleInputChange('directionDegrees', e.target.value)}
                onBlur={() => handleInputBlur('directionDegrees')}
                style={inputStyle}
              />
            </div>
          )}

          <button
            onClick={() => onDeleteEntity(selectedEntity.id)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Delete Selected Object
          </button>
        </>
      )}
    </div>
  );
};

export default SelectedEntityPanel;
