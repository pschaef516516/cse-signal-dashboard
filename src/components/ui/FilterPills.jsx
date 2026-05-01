// Calendar-anchored time filter pills — used in App.jsx header row on Churn and E&U tabs.
// Per D-10, D-11: Today/Yesterday are single-click; Week/Month open a dropdown picker.
// Props: { value: { mode, weekValue, monthValue }, onChange: fn }
import { useState, useEffect, useRef } from 'react'
import { getRecentWeeks, getRecentMonths, formatWeekRangeLabel, formatMonthLabel } from '../../utils/dateRanges'
import pillStyle from './pillStyle'

// Shared dropdown container style — rendered below Week and Month buttons.
const dropdownStyle = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  background: '#FFFFFF',
  border: '1px solid #E1E6F2',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
  zIndex: 100,
  minWidth: 180,
  overflow: 'hidden',
}

export default function FilterPills({ value, onChange }) {
  const [weekOpen, setWeekOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)
  const weekRef = useRef(null)
  const monthRef = useRef(null)

  // Close week dropdown when user clicks outside it.
  useEffect(() => {
    if (!weekOpen) return
    function handleMouseDown(e) {
      if (weekRef.current && !weekRef.current.contains(e.target)) setWeekOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [weekOpen])

  // Close month dropdown when user clicks outside it.
  useEffect(() => {
    if (!monthOpen) return
    function handleMouseDown(e) {
      if (monthRef.current && !monthRef.current.contains(e.target)) setMonthOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [monthOpen])

  // Precompute option lists — last 12 weeks and months.
  const weekOptions = getRecentWeeks(12)
  const monthOptions = getRecentMonths(12)

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 8 }}>

      {/* TODAY */}
      <button
        onClick={() => onChange({ mode: 'today', weekValue: null, monthValue: null })}
        style={pillStyle(value.mode === 'today')}
      >
        Today
      </button>

      {/* YESTERDAY */}
      <button
        onClick={() => onChange({ mode: 'yesterday', weekValue: null, monthValue: null })}
        style={pillStyle(value.mode === 'yesterday')}
      >
        Yesterday
      </button>

      {/* WEEK — pill + dropdown picker */}
      <div ref={weekRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setWeekOpen((prev) => !prev)}
          style={pillStyle(value.mode === 'week')}
        >
          {value.mode === 'week' && value.weekValue
            ? `${formatWeekRangeLabel(value.weekValue)} ↑`
            : 'Week ↓'}
        </button>
        {weekOpen && (
          <div style={dropdownStyle}>
            {weekOptions.map((w) => {
              const isSelected = value.weekValue === w
              return (
                <button
                  key={w}
                  onClick={() => {
                    onChange({ mode: 'week', weekValue: w, monthValue: null })
                    setWeekOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#0057FF' : '#15181D',
                    background: isSelected ? '#F0F5FF' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {formatWeekRangeLabel(w)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* MONTH — pill + dropdown picker */}
      <div ref={monthRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMonthOpen((prev) => !prev)}
          style={pillStyle(value.mode === 'month')}
        >
          {value.mode === 'month' && value.monthValue
            ? `${formatMonthLabel(value.monthValue)} ↑`
            : 'Month ↓'}
        </button>
        {monthOpen && (
          <div style={dropdownStyle}>
            {monthOptions.map((m) => {
              const isSelected = value.monthValue === m
              return (
                <button
                  key={m}
                  onClick={() => {
                    onChange({ mode: 'month', weekValue: null, monthValue: m })
                    setMonthOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#0057FF' : '#15181D',
                    background: isSelected ? '#F0F5FF' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {formatMonthLabel(m)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ALL */}
      <button
        onClick={() => onChange({ mode: 'all', weekValue: null, monthValue: null })}
        style={pillStyle(value.mode === 'all')}
      >
        All
      </button>

    </div>
  )
}
