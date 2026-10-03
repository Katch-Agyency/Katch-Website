import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseServices } from '../firebase';
import { AdminAuthContext } from './adminAuthContext';

function initializeFirebaseAuth() {
  try {
    return { ...getFirebaseServices(), configurationError: false };
  } catch {
    return { auth: null, db: null, configurationError: true };
  }
}

export function AdminAuthProvider({ children }) {
  const [firebase] = useState(initializeFirebaseAuth);
  const [state, setState] = useState(() => ({
    loading: !firebase.configurationError,
    user: null,
    isAdmin: false,
    configurationError: firebase.configurationError,
  }));

  useEffect(() => {
    if (!firebase.auth) return undefined;
    return onAuthStateChanged(firebase.auth, async (user) => {
      if (!user) {
        setState({ loading: false, user: null, isAdmin: false, configurationError: false });
        return;
      }
      try {
        const token = await user.getIdTokenResult(true);
        const isAdmin = token.claims.admin === true;
        if (!isAdmin) {
          await signOut(firebase.auth);
          setState({ loading: false, user: null, isAdmin: false, configurationError: false });
          return;
        }
        setState({ loading: false, user, isAdmin: true, configurationError: false });
      } catch {
        setState({ loading: false, user: null, isAdmin: false, configurationError: false });
      }
    });
  }, [firebase.auth]);

  const value = useMemo(() => ({
    ...state,
    async login(email, password) {
      if (!firebase.auth) throw new Error('firebase_client_not_configured');
      await firebase.persistenceReady;
      const credential = await signInWithEmailAndPassword(firebase.auth, email, password);
      const token = await credential.user.getIdTokenResult(true);
      if (token.claims.admin !== true) {
        await signOut(firebase.auth);
        throw new Error('not_authorized');
      }
      setState({ loading: false, user: credential.user, isAdmin: true, configurationError: false });
    },
    async logout() {
      if (firebase.auth) await signOut(firebase.auth);
    },
  }), [firebase.auth, firebase.persistenceReady, state]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
