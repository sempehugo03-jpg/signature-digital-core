import { useState } from 'react'
import type { FormEvent } from 'react'
import { getAdminCredentials, loginAdmin } from '../../auth/adminAuth'
import { Button, Card, TextInput } from '../shared/DesignSystem'

type Navigate = (route: string) => void

export function AdminLogin({ onLogin, onNavigate }: { onLogin: () => void; onNavigate: Navigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const credentials = getAdminCredentials()

  function submit(event: FormEvent) {
    event.preventDefault()
    const authenticated = loginAdmin(email, password)

    if (!authenticated) {
      setMessage('Identifiants incorrects.')
      return
    }

    setMessage('')
    onLogin()
  }

  return (
    <main className="admin-login-page">
      <button className="brand-mark login-brand" type="button" onClick={() => onNavigate('/')}>
        <img src="/assets/signature-digital-logo.png" alt="" />
        Signature Digital
      </button>
      <Card className="login-card">
        <div className="login-icon"><img src="/assets/signature-digital-logo.png" alt="" /></div>
        <h1>Connexion</h1>
        <p>Accedez a votre espace Signature Digital.</p>
        <form onSubmit={submit}>
          <TextInput label="Email" type="email" value={email} onChange={setEmail} placeholder={credentials.email} />
          <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
          {message && <p className="login-error">{message}</p>}
          <Button type="submit">Se connecter</Button>
        </form>
        {import.meta.env.DEV && (
          <p className="admin-test-access">
            Acces admin test : {credentials.email} / {credentials.password}
          </p>
        )}
      </Card>
      <Card className="login-card template-login-shortcut">
        <p className="sd-eyebrow">Template immobilier</p>
        <h2>Connexion démo vendeur / agent / patron</h2>
        <p>Accédez à la page de connexion premium du template Signature Immobilier.</p>
        <Button variant="secondary" onClick={() => onNavigate('/demo/template-immobilier/connexion')}>
          Ouvrir la connexion template
        </Button>
      </Card>
      <button className="back-site" type="button" onClick={() => onNavigate('/')}>Retour au site</button>
    </main>
  )
}
