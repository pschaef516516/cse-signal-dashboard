import { useState, useEffect, useRef } from 'react'

// A pill button that opens a dropdown when clicked and closes when the user
// clicks outside. Used above the signals table in BrowseTab.
//
// Props:
//   label   — string shown on the pill (e.g. "Source")
//   options — string[] of selectable values
//   value   — currently selected string, or null if none selected
//   onChange — function(newValue) called with the selected string, or null to clear

export default function BrowseFilterPill({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Close the dropdown when the user clicks outside the wrapper div.
  useEffect(() => {
    if (!isOpen) return

    function handleMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isOpen])

  const active = value !== null

  // Pill button styles — blue filled when active, outlined gray when inactive.
  const pillStyle = {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    ...(active
      ? { background: '#0057FF', color: '#FFFFFF', border: '1px solid #0057FF' }
      : { background: '#FFFFFF', color: '#6B7487', border: '1px solid #E1E6F2' }),
  }

  // Dropdown container styles.
  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    background: '#FFFFFF',
    border: '1px solid #E1E6F2',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    zIndex: 100,
    minWidth: 160,
    overflow: 'hidden',
  }

  // Shared style for dropdown item buttons.
  const baseItemStyle = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '10px 14px',
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Pill toggle button */}
      <button onClick={() => setIsOpen((prev) => !prev)} style={pillStyle}>
        {active ? `${label}: ${value}` : label} {isOpen ? '▲' : '▼'}
      </button>

      {/* Dropdown — only rendered when open */}
      {isOpen && (
        <div style={dropdownStyle}>
          {/* "All (clear)" clears the active filter */}
          <button
            onClick={() => { onChange(null); setIsOpen(false) }}
            style={{
              ...baseItemStyle,
              color: '#6B7487',
              background: 'none',
              borderBottom: '1px solid #E1E6F2',
            }}
          >
            All (clear)
          </button>

          {/* One button per option */}
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false) }}
              style={{
                ...baseItemStyle,
                background: value === opt ? '#F0F5FF' : 'none',
                color: value === opt ? '#0057FF' : '#15181D',
                fontWeight: value === opt ? 600 : 400,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
