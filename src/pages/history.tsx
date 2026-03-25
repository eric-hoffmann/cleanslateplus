import { gql, useQuery } from '@apollo/client'
import { css } from '@emotion/react'
import type { Dayjs } from 'dayjs'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { AuthGate } from '../components/auth-gate/AuthGate'
import { DayDetail } from '../components/history/DayDetail'
import { HistorySummary } from '../components/history/HistorySummary'
import { getWeekRange } from '../components/history/helpers'
import { GET_HISTORY_DATA } from '../graphql/history'
import { getBasicFoods } from '../helpers/Food/getBasicFoods'
import { stringifyQuery } from '../helpers/stringifyQuery'
import { useData } from '../hooks/useData'
import type { Log } from '../models/log'
import type { QuickLog } from '../models/quickLog'
import type { ExerciseLog } from '../models/exerciseLog'
import { colors } from '../theme'
import Back from '../assets/common/back.svg'

const { basicFoodsManifest } = getBasicFoods()

/** Deep-clone and enrich logs with basic food data from the local JSON manifest */
const enrichLogs = (logs: readonly any[]): Log[] => {
  return logs
    .map((log) => {
      const enriched = { ...log }
      const basicFoodId = enriched.basicFood
      if (basicFoodId && basicFoodsManifest[basicFoodId]) {
        enriched.logToFood = basicFoodsManifest[basicFoodId]
      }
      if (enriched.logToRecipe) {
        enriched.logToRecipe = {
          ...enriched.logToRecipe,
          ingredients: (enriched.logToRecipe.ingredients || []).map(
            (ing: any) => {
              const copy = { ...ing }
              if (copy.basicFood && basicFoodsManifest[copy.basicFood]) {
                copy.ingredientToFood = basicFoodsManifest[copy.basicFood]
              }
              return copy
            }
          ),
        }
      }
      return enriched as Log
    })
    .filter((log) => {
      const basicFoodId = log.basicFood
      return !basicFoodId || basicFoodsManifest[basicFoodId]
    })
}

const HistoryContent = () => {
  const { profile } = useData()
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null)

  const { start, end, days } = getWeekRange(weekOffset, profile)

  const { data, loading } = useQuery(gql(stringifyQuery(GET_HISTORY_DATA)), {
    variables: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
    fetchPolicy: 'network-only',
  })

  const historyProfile = data?.profiles?.[0]

  // Enrich logs with basic food data (clone to avoid mutating frozen Apollo cache)
  const { logs, quickLogs, exerciseLogs } = useMemo(() => {
    if (!historyProfile) {
      return { logs: [] as Log[], quickLogs: [] as QuickLog[], exerciseLogs: [] as ExerciseLog[] }
    }
    return {
      logs: enrichLogs(historyProfile.logs || []),
      quickLogs: (historyProfile.quick_logs || []).map((ql: any) => ({ ...ql })) as QuickLog[],
      exerciseLogs: (historyProfile.exercise_logs || []).map((el: any) => ({ ...el })) as ExerciseLog[],
    }
  }, [historyProfile])

  const container = css`
    height: 100%;
    display: flex;
    flex-direction: column;
  `

  const topBar = css`
    background-color: white;
    border-bottom: 1px solid #eee;
    height: 50px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    flex-shrink: 0;
  `

  const backToApp = css`
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
    margin-right: 12px;
    img {
      height: 18px;
      width: 18px;
    }
  `

  const title = css`
    font-size: 1rem;
    font-weight: 600;
    color: ${colors.black};
    margin: 0;
  `

  const scrollArea = css`
    flex: 1;
    overflow-y: auto;
  `

  return (
    <div css={container}>
      <div css={topBar}>
        <button
          type="button"
          css={backToApp}
          onClick={() => router.push('/')}
        >
          <img alt="Back to app" src={Back.src} />
        </button>
        <h1 css={title}>History</h1>
      </div>

      <div css={scrollArea}>
        {selectedDay ? (
          <DayDetail
            profile={profile}
            day={selectedDay}
            logs={logs}
            quickLogs={quickLogs}
            exerciseLogs={exerciseLogs}
            onBack={() => setSelectedDay(null)}
          />
        ) : (
          <HistorySummary
            profile={profile}
            days={days}
            logs={logs}
            quickLogs={quickLogs}
            exerciseLogs={exerciseLogs}
            onSelectDay={(day) => setSelectedDay(day)}
            onPrevWeek={() => {
              setWeekOffset((w) => w - 1)
              setSelectedDay(null)
            }}
            onNextWeek={() => {
              setWeekOffset((w) => Math.min(w + 1, 0))
              setSelectedDay(null)
            }}
            weekOffset={weekOffset}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

const History = () => {
  return (
    <AuthGate>
      <HistoryContent />
    </AuthGate>
  )
}

export default History
