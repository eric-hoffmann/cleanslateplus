import { css } from '@emotion/react'
import type { Dayjs } from 'dayjs'
import { groupBy } from 'lodash-es'
import type React from 'react'
import CalMini from '../../assets/common/calmini.svg'
import ProteinMini from '../../assets/common/proteinmini.svg'
import Back from '../../assets/common/back.svg'
import type { ExerciseLog } from '../../models/exerciseLog'
import type { Log, Meal } from '../../models/log'
import { MealEnum } from '../../models/log'
import type { Profile } from '../../models/profile'
import type { QuickLog } from '../../models/quickLog'
import { colors } from '../../theme'
import { calculateMacros } from '../macros/helpers/calculateMacros'
import { calculatePerMacroInLog } from '../macros/helpers/calculateMacros'
import { Image } from '../image/Image'
import { getDayBoundary } from './helpers'

type Props = {
  profile: Profile
  day: Dayjs
  logs: Log[]
  quickLogs: QuickLog[]
  exerciseLogs: ExerciseLog[]
  onBack: () => void
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

const mapMealToColor = (meal: Meal) => {
  if (meal === 'Breakfast') return colors.pink
  if (meal === 'Lunch') return colors.green
  if (meal === 'Dinner') return colors.blue
  return colors.yellow
}

export const DayDetail: React.FC<Props> = ({
  profile,
  day,
  logs,
  quickLogs,
  exerciseLogs,
  onBack,
}) => {
  const dayStart = getDayBoundary(day, profile)
  const dayEnd = dayStart.add(24, 'hour')

  const dayLogs = filterByDay(logs, dayStart, dayEnd)
  const dayQuickLogs = filterByDay(quickLogs, dayStart, dayEnd)
  const dayExerciseLogs = filterByDay(exerciseLogs, dayStart, dayEnd)

  const [calFromLogs, calFromQuick, calFromExercise, protein] = calculateMacros(
    dayLogs,
    dayQuickLogs,
    dayExerciseLogs
  ).map(Math.round)

  const totalCalories = calFromLogs + calFromQuick - calFromExercise

  const sortedLogs = [...dayLogs].sort(
    (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))
  )
  const groupedLogs = groupBy(sortedLogs, 'meal')

  const container = css`
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  `

  const header = css`
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  `

  const backButton = css`
    background: none;
    border: 1px solid ${colors.lightgrey};
    border-radius: 5px;
    padding: 8px 12px;
    cursor: pointer;
    margin-right: 16px;
    display: flex;
    align-items: center;
    img {
      height: 16px;
      width: 16px;
    }
  `

  const dateTitle = css`
    font-size: 1.1rem;
    font-weight: 600;
    color: ${colors.black};
    margin: 0;
  `

  const summaryBar = css`
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 12px;
    margin-bottom: 20px;
    background-color: ${colors.white};
    border: 1px solid ${colors.lightgrey};
    border-radius: 8px;
  `

  const summaryItem = css`
    font-size: 0.95rem;
    padding: 6px 14px;
    border-radius: 5px;
    font-weight: 500;
  `

  const sectionTitle = css`
    font-size: 0.9rem;
    font-weight: 600;
    color: ${colors.darkgrey};
    margin-bottom: 8px;
    margin-top: 20px;
    display: inline-block;
    padding: 5px 7.5px;
    border-radius: 5px;
  `

  const itemRow = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    margin-bottom: 4px;
    border-radius: 6px;
    background-color: ${colors.white};
    border: 1px solid ${colors.lightgrey};
  `

  const itemName = css`
    font-size: 0.9rem;
    color: ${colors.black};
    flex: 1;
  `

  const macroTag = css`
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    margin-left: 10px;
    white-space: nowrap;

    img {
      margin-right: 4px;
    }
  `

  const emptyState = css`
    text-align: center;
    padding: 40px;
    color: ${colors.darkgrey};
    font-style: italic;
  `

  const hasData =
    dayLogs.length > 0 || dayQuickLogs.length > 0 || dayExerciseLogs.length > 0

  return (
    <div css={container}>
      <div css={header}>
        <button type="button" css={backButton} onClick={onBack}>
          <img alt="Back" src={Back.src} />
        </button>
        <h2 css={dateTitle}>{day.format('dddd, MMMM D, YYYY')}</h2>
      </div>

      {hasData && (
        <div css={summaryBar}>
          <span css={summaryItem} className="green">
            {totalCalories} cal
          </span>
          <span css={summaryItem} className="blue">
            {protein}g protein
          </span>
          {calFromExercise > 0 && (
            <span css={summaryItem} className="pink">
              -{calFromExercise} exercise
            </span>
          )}
        </div>
      )}

      {!hasData && <div css={emptyState}>No entries for this day</div>}

      {/* Food logs grouped by meal */}
      {Object.keys(groupedLogs)
        .sort((a, b) => MealEnum[a as Meal] - MealEnum[b as Meal])
        .map((mealName) => {
          const meal = mealName as Meal
          const mealLogs = groupedLogs[meal]

          return (
            <div key={meal}>
              <div
                css={sectionTitle}
                style={{ backgroundColor: mapMealToColor(meal) }}
              >
                {meal}
              </div>
              {mealLogs.map((log) => {
                const food = log.logToFood
                const recipe = log.logToRecipe
                const name =
                  recipe?.name ||
                  food?.name ||
                  log.barcode?.name ||
                  log.alias ||
                  'Unknown'

                const logCalories = Math.round(
                  calculatePerMacroInLog('CALORIE', [log])
                )
                const logProtein = Math.round(
                  calculatePerMacroInLog('PROTEIN', [log])
                )

                return (
                  <div key={log.id} css={itemRow}>
                    <div css={itemName}>
                      {name}
                      <span
                        css={css`
                          font-size: 0.8rem;
                          color: ${colors.darkgrey};
                          margin-left: 6px;
                        `}
                      >
                        ({log.amount} {log.unit.toLowerCase()})
                      </span>
                    </div>
                    <div className="frc">
                      <span css={macroTag}>
                        <Image
                          width={10}
                          height={10}
                          alt="Calories"
                          src={CalMini}
                        />
                        {logCalories}
                      </span>
                      <span css={macroTag}>
                        <Image
                          width={10}
                          height={10}
                          alt="Protein"
                          src={ProteinMini}
                        />
                        {logProtein}g
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

      {/* Quick logs */}
      {dayQuickLogs.length > 0 && (
        <div>
          <div
            css={sectionTitle}
            style={{ backgroundColor: colors.lightgrey }}
          >
            Quick Logs
          </div>
          {dayQuickLogs.map((ql) => (
            <div key={ql.id} css={itemRow}>
              <div css={itemName}>{ql.name || 'Quick log'}</div>
              <div className="frc">
                <span css={macroTag}>
                  <Image
                    width={10}
                    height={10}
                    alt="Calories"
                    src={CalMini}
                  />
                  {Math.round(ql.calories)}
                </span>
                <span css={macroTag}>
                  <Image
                    width={10}
                    height={10}
                    alt="Protein"
                    src={ProteinMini}
                  />
                  {Math.round(ql.protein)}g
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise logs */}
      {dayExerciseLogs.length > 0 && (
        <div>
          <div
            css={sectionTitle}
            style={{ backgroundColor: colors.lightgrey }}
          >
            Exercise
          </div>
          {dayExerciseLogs.map((el) => (
            <div key={el.id} css={itemRow}>
              <div css={itemName}>{el.name || el.groupName || 'Exercise'}</div>
              <div className="frc">
                <span css={macroTag}>
                  <Image
                    width={10}
                    height={10}
                    alt="Calories burned"
                    src={CalMini}
                  />
                  -{Math.round(el.amount)} cal
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
