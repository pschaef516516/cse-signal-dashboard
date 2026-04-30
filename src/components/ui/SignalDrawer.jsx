// Fixed overlay drawer that slides in from the right.
// Per D-04: slide-in from right. Per D-07: backdrop click closes; no explicit close button.
// Per RESEARCH.md Pitfall 3: pointerEvents must be 'none' when closed so chart clicks still work.
// Per RESEARCH.md Pattern 3: stay in DOM (do NOT use display:none — kills CSS transition).
export default function SignalDrawer({ open, title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Backdrop — click closes drawer (D-07) */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(21, 24, 29, 0.4)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
      {/* Panel — slides in from the right via transform */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          background: '#FFFFFF',
          borderLeft: '1px solid #E1E6F2',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
        }}
      >
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E1E6F2', flexShrink: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#15181D', margin: 0 }}>{title}</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
