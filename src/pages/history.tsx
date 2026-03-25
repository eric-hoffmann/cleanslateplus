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
import { addBasicFoodsToProfile } from '../helpers/profile/addBasicFoodsToProfile'
import { stringifyQuery } from '../helpers/stringifyQuery'
import { useData } from '../hooks/useData'
import type { Log } from '../models/log'
import type { Profile } from '../models/profile'
import type { QuickLog } from '../models/quickLog'
import type { ExerciseLog } from '../models/exerciseLog'
import { colors } from '../theme'
import Back from '../assets/common/back.svg'

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

  // Enrich logs with basic food data (same as main app's handleData)
  const { logs, quickLogs, exerciseLogs } = useMemo(() => {
    if (!historyProfile) {
      return { logs: [] as Log[], quickLogs: [] as QuickLog[], exerciseLogs: [] as ExerciseLog[] }
    }
    const { profiles } = addBasicFoodsToProfile([historyProfile as Profile])
    const enriched = profiles[0]
    return {
      logs: enriched.logs || [],
      quickLogs: enriched.quick_logs || [],
      exerciseLogs: enriched.exercise_logs || [],
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
