// Centered modal that replaces SignalDrawer — wraps SignalDetail with Prev/Next navigation.
import { useEffect } from 'react'
import SignalDetail from './SignalDetail'

// Props: open, signals, currentIndex, onClose, onPrev, onNext
export default function SignalModal({ open, signals, currentIndex, onClose, onPrev, onNext }) {
  // Keyboard navigation: Escape closes, ArrowLeft/ArrowRight navigate
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onPrev()
      } else if (e.key === 'ArrowRight' && currentIndex < signals.length - 1) {
        onNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, currentIndex, signals.length, onClose, onPrev, onNext])

  // Render nothing if modal is closed or signals list is empty
  if (!open || !signals || signals.length === 0) return null

  const isPrevDisabled = currentIndex === 0
  const isNextDisabled = currentIndex === signals.length - 1

  const navButtonBase = {
    background: 'none',
    border: '1px solid #E1E6F2',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 16,
    cursor: 'pointer',
    lineHeight: 1,
  }

  return (
    <>
      {/* Backdrop — clicking outside the card closes the modal */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(21, 24, 29, 0.5)',
          zIndex: 1000,
        }}
      />

      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 64px)',
          background: '#FFFFFF',
          border: '1px solid #E1E6F2',
          borderRadius: 16,
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header — Prev / counter / Next on left, X on right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #E1E6F2',
            flexShrink: 0,
          }}
        >
          {/* Left: navigation controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onPrev}
              disabled={isPrevDisabled}
              aria-label="Previous signal"
              style={{
                ...navButtonBase,
                color: isPrevDisabled ? '#E1E6F2' : '#15181D',
                cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              ←
            </button>

            <span
              style={{
                fontSize: 13,
                color: '#6B7487',
                fontWeight: 500,
              }}
            >
              {currentIndex + 1} of {signals.length} signals
            </span>

            <button
              onClick={onNext}
              disabled={isNextDisabled}
              aria-label="Next signal"
              style={{
                ...navButtonBase,
                color: isNextDisabled ? '#E1E6F2' : '#15181D',
                cursor: isNextDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              →
            </button>
          </div>

          {/* Right: close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: '#6B7487',
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body — scrollable signal detail */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <SignalDetail signal={signals[currentIndex]} onBack={null} />
        </div>
      </div>
    </>
  )
}
