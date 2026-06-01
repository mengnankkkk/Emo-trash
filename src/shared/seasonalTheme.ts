export type CalendarSeason = 'spring' | 'summer' | 'autumn' | 'winter'
export type GardenSeason = 'seed' | 'bloom' | 'flourish'

export interface SeasonalTheme {
  calendarSeason: CalendarSeason
  calendarSeasonLabel: string
  gardenSeason: GardenSeason
  gardenSeasonLabel: string
  combinedLabel: string
  combinedKey: string
  moodTint: string
}

function getCalendarSeason(month: number): CalendarSeason {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

const calendarSeasonLabels: Record<CalendarSeason, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬'
}

const gardenSeasonLabels: Record<GardenSeason, string> = {
  seed: '新芽季',
  bloom: '开花季',
  flourish: '盛放季'
}

const combinedLabelMap: Record<string, string> = {
  'spring-seed': '春日播种',
  'spring-bloom': '春日开花',
  'spring-flourish': '春日盛放',
  'summer-seed': '夏日播种',
  'summer-bloom': '夏日开花',
  'summer-flourish': '夏日盛放',
  'autumn-seed': '秋日播种',
  'autumn-bloom': '秋日开花',
  'autumn-flourish': '秋日盛放',
  'winter-seed': '冬日播种',
  'winter-bloom': '冬日开花',
  'winter-flourish': '冬日盛放'
}

const moodTints: Record<CalendarSeason, string> = {
  spring: 'rgba(76, 175, 80, 0.22)',
  summer: 'rgba(255, 193, 7, 0.22)',
  autumn: 'rgba(216, 67, 21, 0.18)',
  winter: 'rgba(25, 118, 210, 0.18)'
}

export function getGardenSeasonByLevel(level: 1 | 2 | 3): GardenSeason {
  if (level === 1) return 'seed'
  if (level === 2) return 'bloom'
  return 'flourish'
}

export function computeSeasonalTheme(gardenLevel: 1 | 2 | 3, now = new Date()): SeasonalTheme {
  const month = now.getMonth() + 1
  const calendarSeason = getCalendarSeason(month)
  const gardenSeason = getGardenSeasonByLevel(gardenLevel)
  const combinedKey = `${calendarSeason}-${gardenSeason}`

  return {
    calendarSeason,
    calendarSeasonLabel: calendarSeasonLabels[calendarSeason],
    gardenSeason,
    gardenSeasonLabel: gardenSeasonLabels[gardenSeason],
    combinedLabel:
      combinedLabelMap[combinedKey] ??
      `${calendarSeasonLabels[calendarSeason]}日${gardenSeasonLabels[gardenSeason]}`,
    combinedKey,
    moodTint: moodTints[calendarSeason]
  }
}
