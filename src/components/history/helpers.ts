import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { Profile } from '../../models/profile'

/** Get the start-of-day boundary for a given date, using the profile's startTime */
export const getDayBoundary = (date: Dayjs, profile: Profile): Dayjs => {
  const [hour, minute, second] = profile.startTime.split(':').map(Number)
  return date.startOf('day').set('hour', hour).set('minute', minute).set('second', second)
}

/** Get the start (Monday) and end (Sunday) of the week containing the given date */
export const getWeekRange = (
  weekOffset: number,
  profile: Profile
): { start: Dayjs; end: Dayjs; days: Dayjs[] } => {
  const now = dayjs().add(weekOffset, 'week')
  // day() returns 0 for Sunday, 1 for Monday, etc.
  const dayOfWeek = now.day()
  const monday = now.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day')

  const days: Dayjs[] = []
  for (let i = 0; i < 7; i++) {
    days.push(monday.add(i, 'day'))
  }

  const start = getDayBoundary(days[0], profile)
  const end = getDayBoundary(days[6], profile).add(24, 'hour')

  return { start, end, days }
}

/** Check if a given date is today */
export const isToday = (date: Dayjs): boolean => {
  return date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
}

/** Format a date for display */
export const formatDate = (date: Dayjs): string => {
  return date.format('ddd, MMM D')
}

/** Format a week range label */
export const formatWeekLabel = (days: Dayjs[]): string => {
  const first = days[0]
  const last = days[6]
  if (first.month() === last.month()) {
    return `${first.format('MMM D')} – ${last.format('D, YYYY')}`
  }
  return `${first.format('MMM D')} – ${last.format('MMM D, YYYY')}`
}
