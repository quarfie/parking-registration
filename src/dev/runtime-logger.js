// src/dev/runtime-logger.js
;(function attachRuntimeLogger() {
  // Simple page badge so you know logger is active (optional)
  // const badge = document.createElement('div')
  // Object.assign(badge.style, {
  //   position: 'fixed', bottom: '8px', right: '8px',
  //   padding: '4px 8px', background: '#111827', color: 'white',
  //   fontSize: '12px', borderRadius: '6px', opacity: '0.8', zIndex: 99999,
  // })
  // badge.textContent = 'Runtime logger'
  // document.addEventListener('DOMContentLoaded', () => document.body.appendChild(badge))

  window.addEventListener('error', (e) => {
    // e.error may be undefined for some script errors; fallback to message/stack
    const err = e.error || {
      message: e.message,
      stack: e.filename + ':' + e.lineno + ':' + e.colno,
    }
    // Surface clearly in console
    console.groupCollapsed(
      '%c[Runtime Error]',
      'color:#ef4444;font-weight:bold;',
      err.message || e.message,
    )
    console.error(err)
    console.groupEnd()
  })

  window.addEventListener('unhandledrejection', (e) => {
    console.groupCollapsed('%c[Unhandled Promise Rejection]', 'color:#f59e0b;font-weight:bold;')
    console.error(e.reason)
    console.groupEnd()
  })
})()
