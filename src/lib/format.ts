export function formatClock(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function formatListTime(ts: number, now = Date.now()): string {
  const date = new Date(ts)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfMsg = new Date(ts)
  startOfMsg.setHours(0, 0, 0, 0)
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfMsg.getTime()) / 86_400_000,
  )

  if (dayDiff === 0) return formatClock(ts)
  if (dayDiff === 1) return 'Yesterday'
  if (dayDiff < 7) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDayLabel(ts: number, now = Date.now()): string {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfMsg = new Date(ts)
  startOfMsg.setHours(0, 0, 0, 0)
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfMsg.getTime()) / 86_400_000,
  )
  if (dayDiff === 0) return 'Today'
  if (dayDiff === 1) return 'Yesterday'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(ts))
}

export function previewText(body: string, max = 72): string {
  const compact = body.replace(/\s+/g, ' ').trim()
  if (compact.length <= max) return compact
  return `${compact.slice(0, max - 1)}…`
}

export function avatarStyle(hue: number): { background: string; color: string } {
  return {
    background: `linear-gradient(145deg, hsl(${hue} 55% 42%), hsl(${hue} 48% 28%))`,
    color: '#f4fffb',
  }
}
