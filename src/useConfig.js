import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { realtimedb } from './firebase'
import { useAuth } from './Authcontext'

// Defaults mínimos lidos pelas páginas (espelha o que Configurações salva)
const PADRAO = {
  semSpoiler: false,
  timesFavoritos: [],
  regiao: 'todas',
}

function lerLocal() {
  try {
    return { ...PADRAO, ...(JSON.parse(localStorage.getItem('cn-config') || '{}')) }
  } catch {
    return { ...PADRAO }
  }
}

// Lê as preferências do usuário: localStorage na hora + Realtime DB reativo.
export function useConfig() {
  const { user } = useAuth()
  const [config, setConfig] = useState(lerLocal)

  // Reage a mudanças salvas em outra aba
  useEffect(() => {
    const onStorage = (e) => { if (e.key === 'cn-config') setConfig(lerLocal()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Sincroniza com o banco quando logado
  useEffect(() => {
    if (!user) { setConfig(lerLocal()); return }
    const r = ref(realtimedb, `users/${user.uid}/config`)
    const unsub = onValue(r, (snap) => {
      if (snap.exists()) setConfig((c) => ({ ...c, ...snap.val() }))
    })
    return () => unsub()
  }, [user])

  return config
}
