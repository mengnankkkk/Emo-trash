import { useMemo } from 'react'
import type { WeatherType } from '../../../../shared/emotionWeather'

interface GardenWeatherProps {
  weatherType: WeatherType
  label: string
}

function PixelRaindrops(): React.JSX.Element {
  const drops = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${8 + i * 7.5}%`,
        delay: `${(i * 0.18) % 1.2}s`,
        height: i % 3 === 0 ? '6px' : '4px'
      })),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((drop) => (
        <span
          key={drop.id}
          className="absolute top-0 w-[2px] animate-[pixel-rain_0.8s_linear_infinite] bg-[#60a5fa]"
          style={{
            left: drop.left,
            height: drop.height,
            animationDelay: drop.delay,
            imageRendering: 'pixelated'
          }}
        />
      ))}
    </div>
  )
}

function PixelLightning(): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute left-[30%] top-[10%] animate-[pixel-flash_2.4s_ease-in-out_infinite]"
        width="12"
        height="20"
        viewBox="0 0 6 10"
        style={{ imageRendering: 'pixelated' }}
      >
        <rect x="3" y="0" width="2" height="2" fill="#fbbf24" />
        <rect x="2" y="2" width="2" height="2" fill="#fbbf24" />
        <rect x="1" y="4" width="3" height="2" fill="#fde68a" />
        <rect x="2" y="6" width="2" height="2" fill="#fbbf24" />
        <rect x="3" y="8" width="2" height="2" fill="#fbbf24" />
      </svg>
      <PixelRaindrops />
    </div>
  )
}

function PixelWind(): React.JSX.Element {
  const lines = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        top: `${15 + i * 14}%`,
        width: `${16 + (i % 3) * 8}px`,
        delay: `${i * 0.3}s`
      })),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {lines.map((line) => (
        <span
          key={line.id}
          className="absolute left-0 h-[2px] animate-[pixel-wind_1.6s_linear_infinite] bg-[var(--text-muted)] opacity-40"
          style={{
            top: line.top,
            width: line.width,
            animationDelay: line.delay,
            imageRendering: 'pixelated'
          }}
        />
      ))}
    </div>
  )
}

function PixelClouds({ dark }: { dark?: boolean }): React.JSX.Element {
  const clouds = useMemo(
    () => [
      { id: 0, left: '10%', top: '15%', scale: 1, delay: '0s' },
      { id: 1, left: '50%', top: '8%', scale: 1.2, delay: '0.8s' },
      { id: 2, left: '75%', top: '20%', scale: 0.8, delay: '1.6s' }
    ],
    []
  )

  const color = dark ? '#64748b' : '#cbd5e1'

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {clouds.map((cloud) => (
        <svg
          key={cloud.id}
          className="absolute animate-[pixel-drift_8s_linear_infinite]"
          style={{
            left: cloud.left,
            top: cloud.top,
            transform: `scale(${cloud.scale})`,
            animationDelay: cloud.delay,
            imageRendering: 'pixelated'
          }}
          width="24"
          height="12"
          viewBox="0 0 12 6"
        >
          <rect x="2" y="2" width="8" height="4" fill={color} />
          <rect x="4" y="0" width="4" height="2" fill={color} />
          <rect x="0" y="4" width="2" height="2" fill={color} opacity="0.5" />
          <rect x="10" y="4" width="2" height="2" fill={color} opacity="0.5" />
        </svg>
      ))}
    </div>
  )
}

function PixelSun(): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute right-[15%] top-[10%] animate-[pixel-pulse_3s_ease-in-out_infinite]"
        width="20"
        height="20"
        viewBox="0 0 10 10"
        style={{ imageRendering: 'pixelated' }}
      >
        <rect x="4" y="0" width="2" height="2" fill="#fbbf24" />
        <rect x="4" y="8" width="2" height="2" fill="#fbbf24" />
        <rect x="0" y="4" width="2" height="2" fill="#fbbf24" />
        <rect x="8" y="4" width="2" height="2" fill="#fbbf24" />
        <rect x="3" y="3" width="4" height="4" fill="#fde68a" />
        <rect x="1" y="1" width="2" height="2" fill="#fbbf24" opacity="0.6" />
        <rect x="7" y="1" width="2" height="2" fill="#fbbf24" opacity="0.6" />
        <rect x="1" y="7" width="2" height="2" fill="#fbbf24" opacity="0.6" />
        <rect x="7" y="7" width="2" height="2" fill="#fbbf24" opacity="0.6" />
      </svg>
    </div>
  )
}

function PixelRainbow(): React.JSX.Element {
  const colors = ['#ef4444', '#f97316', '#fbbf24', '#34d399', '#60a5fa', '#8b5cf6']

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute left-[20%] top-[5%] animate-[pixel-pulse_4s_ease-in-out_infinite] opacity-70"
        width="60"
        height="30"
        viewBox="0 0 30 15"
        style={{ imageRendering: 'pixelated' }}
      >
        {colors.map((color, i) => (
          <path
            key={color}
            d={`M ${2 + i} ${14 - i} Q 15 ${-2 - i} ${28 - i} ${14 - i}`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <PixelSun />
    </div>
  )
}

const weatherEffects: Record<WeatherType, () => React.JSX.Element> = {
  thunderstorm: PixelLightning,
  rainstorm: PixelRaindrops,
  windy: PixelWind,
  cloudy: () => <PixelClouds dark />,
  sunny: PixelSun,
  rainbow: PixelRainbow,
  overcast: () => <PixelClouds />
}

function GardenWeather({ weatherType, label }: GardenWeatherProps): React.JSX.Element {
  const Effect = weatherEffects[weatherType]

  return (
    <div className="relative h-12 w-full overflow-hidden rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)]">
      <Effect />
      <span className="absolute bottom-1 right-2 text-[9px] tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </span>
    </div>
  )
}

export default GardenWeather
