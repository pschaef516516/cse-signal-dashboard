export default function pillStyle(active) {
  return {
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    border: active ? '1px solid #0057FF' : '1px solid #E1E6F2',
    background: active ? '#0057FF' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#6B7487',
    cursor: 'pointer',
    minHeight: 36,
  }
}
