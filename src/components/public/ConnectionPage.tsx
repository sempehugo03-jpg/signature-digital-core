import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Card, TextInput } from '../shared/DesignSystem'

type LoginResult = 'success' | 'invalid' | 'not_found'

export function ConnectionPage({ onSubmit }: { onSubmit: (email: string, password: string) => LoginResult }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = onSubmit(email, password)

    if (result === 'invalid') {
      setMessage('Identifiants incorrects.')
      return
    }

    if (result === 'not_found') {
      setMessage('Aucun espace trouvé avec ces identifiants.')
      return
    }

    setMessage('')
  }

  return (
    <main className="admin-login-page connection-page">
      <Card className="login-card connection-card">
        <div className="login-icon"><img src="/assets/signature-digital-logo.png" alt="" /></div>
        <h1>Connexion</h1>
        <p>Accédez à votre espace Signature Digital.</p>
        <form onSubmit={submit}>
          <TextInput label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@entreprise.fr" />
          <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
          {message && <p className="login-error">{message}</p>}
          <Button type="submit">Se connecter</Button>
        </form>
        <p className="muted">
          Vous avez créé un espace après votre demande de démo ? Connectez-vous avec l’email et le mot de passe utilisés lors de votre demande.
        </p>
      </Card>
    </main>
  )
}
