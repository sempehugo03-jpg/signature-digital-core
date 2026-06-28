import { useEffect, useState } from 'react'
import { completeInvite, getInvite } from '../../lib/signature-digital-invites-client'
import { Button, Card, TextInput } from '../shared/DesignSystem'

export function InviteAccessPage({ token, onNavigate }: { token: string; onNavigate: (route: string) => void }) {
  const [status, setStatus] = useState('Verification de l invitation...')
  const [password, setPassword] = useState('')

  useEffect(() => {
    void getInvite(token).then((result) => {
      setStatus(result.ok ? 'Invitation trouvee. Creez votre acces.' : result.message ?? 'Invitation introuvable.')
    })
  }, [token])

  async function submit() {
    const result = await completeInvite(token, password)
    setStatus(result.ok ? 'Acces cree. Vous pouvez maintenant revenir a la connexion.' : result.message ?? 'Impossible de finaliser cette invitation.')
  }

  return (
    <main className="confirmation-page">
      <Card className="confirmation-card">
        <p className="sd-eyebrow">Invitation Signature Digital</p>
        <h1>Creer votre acces</h1>
        <p>{status}</p>
        <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
        <div className="inline-actions">
          <Button onClick={() => void submit()}>Finaliser mon acces</Button>
          <Button variant="secondary" onClick={() => onNavigate('/connexion')}>Connexion</Button>
        </div>
      </Card>
    </main>
  )
}
