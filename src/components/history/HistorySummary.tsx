import { css } from '@emotion/react'
import type { Dayjs } from 'dayjs'
import type React from 'react'
import type { ExerciseLog } from '../../models/exerciseLog'
import type { Log } from '../../models/log'
import type { Profile } from '../../models/profile'
import type { QuickLog } from '../../models/quickLog'
import { calculateMacros } from '../macros/helpers/calculateMacros'
import { colors } from '../../theme'
import LeftArrow from '../../assets/common/leftArrow.svg'
import RightArrow from '../../assets/common/rightArrow.svg'
import { getDayBoundary, isToday, formatDate, formatWeekLabel } from './helpers'

type Props = {
  profile: Profile
  days: Dayjs[]
  logs: Log[]
  quickLogs: QuickLog[]
  exerciseLogs: ExerciseLog[]
  onSelectDay: (day: Dayjs) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  weekOffset: number
  loading: boolean
}

const filterByDay = <T extends { createdAt: Date | string }>(
  items: T[],
  dayStart: Dayjs,
  dayEnd: Dayjs
): T[] => {
  const startMs = dayStart.valueOf()
  const endMs = dayEnd.valueOf()
  return items.filter((item) => {
    const ts = new Date(item.createdAt).getTime()
    return ts >= startMs && ts < endMs
  })
}

export const HistorySummary: React.FC<Props> = ({
  profile,
  days,
  logs,
  quickLogs,
  exerciseLogs,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
  weekOffset,
  loading,
}) => {
  const container = css`
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  `

  const header = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h2 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: ${colors.black};
    }
  `

  const navButton = css`
    background: none;
    border: 1px solid ${colors.lightgrey};
    border-radius: 5px;
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    img {
      height: 16px;
      width: 16px;
    }
    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  `

  const dayRow = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    margin-bottom: 8px;
    border-radius: 8px;
    background-color: ${colors.white};
    border: 1px solid ${colors.lightgrey};
    cursor: pointer;
    transition: background-color 0.15s;

    &:hover {
      background-color: ${colors.green};
    }

    &:active {
      background-color: ${colors.darkblue};
    }
  `

  const todayRow = css`
    border-color: ${colors.verydarkblue};
    border-width: 2px;
  `

  const dayLabel = css`
    font-size: 0.95rem;
    font-weight: 500;
    color: ${colors.black};
    min-width: 120px;
  `

  const macroValue = css`
    font-size: 0.85rem;
    padding: 4px 10px;
    border-radius: 5px;
    min-width: 50px;
    text-align: center;
    margin-left: 8px;
  `

  const emptyDay = css`
    font-size: 0.85rem;
    color: ${colors.darkgrey};
    font-style: italic;
  `

  const todayLabel = css`
    font-size: 0.75rem;
    color: ${colors.success};
    font-weight: 600;
    margin-left: 8px;
  `

  const loadingStyle = css`
    text-align: center;
    padding: 40px;
    color: ${colors.darkgrey};
  `

  if (loading) {
    return (
      <div css={container}>
        <div css={loadingStyle}>Loading history...</div>
      </div>
    )
  }

  return (
    <div css={container}>
      <div css={header}>
        <button type="button" css={navButton} onClick={onPrevWeek}>
          <img alt="Previous week" src={LeftArrow.src} />
        </button>
        <h2>{formatWeekLabel(days)}</h2>
        <button
          type="button"
          css={navButton}
          onClick={onNextWeek}
          disabled={weekOffset >= 0}
        >
          <img alt="Next week" src={RightArrow.src} />
        </button>
      </div>

      {days.map((day) => {
        const dayStart = getDayBoundary(day, profile)
        const dayEnd = dayStart.add(24, 'hour')

        const dayLogs = filterByDay(logs, dayStart, dayEnd)
        const dayQuickLogs = filterByDay(quickLogs, dayStart, dayEnd)
        const dayExerciseLogs = filterByDay(exerciseLogs, dayStart, dayEnd)

        const hasData =
          dayLogs.length > 0 ||
          dayQuickLogs.length > 0 ||
          dayExerciseLogs.length > 0

        const [calFromLogs, calFromQuick, calFromExercise, protein] = hasData
          ? calculateMacros(dayLogs, dayQuickLogs, dayExerciseLogs).map(
              Math.round
            )
          : [0, 0, 0, 0]

        const totalCalories = calFromLogs + calFromQuick - calFromExercise
        const today = isToday(day)

        return (
          <div
            key={day.format('YYYY-MM-DD')}
            css={[dayRow, today && todayRow]}
            onClick={() => onSelectDay(day)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSelectDay(day)
            }}
            tabIndex={0}
            role="button"
          >
            <div className="frc">
              <span css={dayLabel}>{formatDate(day)}</span>
              {today && <span css={todayLabel}>Today</span>}
            </div>
            {hasData ? (
              <div className="frc">
                <span css={macroValue} className="green">
                  {totalCalories} cal
                </span>
                <span css={macroValue} className="blue">
                  {protein}g protein
                </span>
              </div>
            ) : (
              <span css={emptyDay}>No entries</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
