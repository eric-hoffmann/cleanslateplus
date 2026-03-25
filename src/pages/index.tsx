import 'firebase/compat/auth'
import firebase from 'firebase/compat/app'
import { App } from '../components/app/App'
import { AuthGate } from '../components/auth-gate/AuthGate'
import { getFirebaseConfig } from '../helpers/getFirebaseConfig'

// Only create Firebase if it has yet to be initialized
export const firebaseApp = !firebase.apps.length
  ? firebase.initializeApp(getFirebaseConfig())
  : firebase.app()

const Index = () => {
  return (
    <AuthGate>
      <App />
    </AuthGate>
  )
}

export default Index
