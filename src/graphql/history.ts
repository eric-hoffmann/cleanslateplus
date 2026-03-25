import { gql } from '../helpers/gql'

export const GET_HISTORY_DATA = gql`
  query GET_HISTORY_DATA($startDate: timestamptz!, $endDate: timestamptz!) {
    profiles {
      ...profile

      foods {
        ...food
      }

      recipes {
        ...recipe
      }

      logs(
        where: { createdAt: { _gte: $startDate, _lte: $endDate } }
        order_by: { createdAt: desc }
      ) {
        ...log
      }

      quick_logs(
        where: { createdAt: { _gte: $startDate, _lte: $endDate } }
        order_by: { createdAt: desc }
      ) {
        ...quick_log
      }

      exercise_logs(
        where: { createdAt: { _gte: $startDate, _lte: $endDate } }
        order_by: { createdAt: desc }
      ) {
        ...exercise_log
      }
    }
  }
`
