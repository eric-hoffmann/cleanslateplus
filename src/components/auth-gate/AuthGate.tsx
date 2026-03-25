import { useEffect, useState } from 'react'
import { Login } from '../login/Login'
import { firebaseEnabled } from '../../helpers/getFirebaseConfig'
import { getLoginStatus } from '../../helpers/getLoginStatus'
import { isLoadedUser } from '../../helpers/isLoadedUser'
import { useAuthentication } from '../../hooks/useAuthentication'
import { useOffline } from '../../hooks/useOffline'
import { useOfflineStatus } from '../../hooks/useOfflineStatus'
import { useUser } from '../../hooks/useUser'

type Props = {
  children: React.ReactNode
}

export const AuthGate: React.FC<Props> = ({ children }) => {
  const user = useUser()
  const offline = useOfflineStatus()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useOffline()
  useAuthentication(offline)

  if (!mounted) {
    return <div />
  }

  if ((isLoadedUser(user) && firebaseEnabled) || getLoginStatus()) {
    return <>{children}</>
  }

  return <Login />
}
