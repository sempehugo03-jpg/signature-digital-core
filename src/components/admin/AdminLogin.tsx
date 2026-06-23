import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Card, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

export function AdminLogin({ onLogin, onNavigate }: { onLogin: () => void; onNavigate: Navigate }) {
  const [email, setEmail] = useState('vous@signature-digital.fr')
  const [password, setPassword] = useState('signature')

  function submit(event: FormEvent) {
    event.preventDefault()
    onLogin()
  }

  return (
    <main className="admin-login-page">
      <button className="brand-mark login-brand" type="button" onClick={() => onNavigate('/')}>
        <span />
        Signature Digital
      </button>
      <Card className="login-card">
        <div className="login-icon">⌁</div>
        <h1>Connexion admin</h1>
        <p>Accédez au cockpit Signature Digital.</p>
        <form onSubmit={submit}>
          <TextInput label="Email" type="email" value={email} onChange={setEmail} />
          <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
          <Button type="submit">Se connecter</Button>
        </form>
      </Card>
      <button className="back-site" type="button" onClick={() => onNavigate('/')}>Retour au site</button>
    </main>
  )
}
