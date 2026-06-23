import { useState } from 'react'
import type { FormEvent } from 'react'
import { loginAdmin } from '../../auth/adminAuth'
import { Button, Card, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

export function AdminLogin({ onLogin, onNavigate }: { onLogin: () => void; onNavigate: Navigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const authenticated = loginAdmin(email, password)

    if (!authenticated) {
      setMessage('Identifiants incorrects')
      return
    }

    setMessage('')
    onLogin()
  }

  return (
    <main className="admin-login-page">
      <button className="brand-mark login-brand" type="button" onClick={() => onNavigate('/')}>
        <img src="/assets/signature-digital-mark.svg" alt="" />
        Signature Digital
      </button>
      <Card className="login-card">
        <div className="login-icon"><img src="/assets/signature-digital-mark.svg" alt="" /></div>
        <h1>Connexion admin</h1>
        <p>Accédez au cockpit Signature Digital.</p>
        <form onSubmit={submit}>
          <TextInput label="Email" type="email" value={email} onChange={setEmail} placeholder="admin@signature-digital.fr" />
          <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
          {message && <p className="login-error">{message}</p>}
          <Button type="submit">Se connecter</Button>
        </form>
      </Card>
      <button className="back-site" type="button" onClick={() => onNavigate('/')}>Retour au site</button>
    </main>
  )
}
