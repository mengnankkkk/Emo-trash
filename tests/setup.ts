import '@testing-library/jest-dom/vitest'

if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: () => ({
      clearRect: () => undefined,
      fillRect: () => undefined,
      imageSmoothingEnabled: false,
      fillStyle: '#000000'
    }),
    configurable: true
  })

  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    value: () => 'data:image/png;base64,placeholder',
    configurable: true
  })
}
