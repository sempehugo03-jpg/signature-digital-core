import { Button, Card, SectionTitle } from '../shared/DesignSystem'

const templateRoutes = {
  public: '/demo/template-immobilier',
  seller: '/demo/template-immobilier/vendeur',
  agent: '/demo/template-immobilier/agent',
  owner: '/demo/template-immobilier/patron',
  login: '/connexion',
}

export function AdminTemplates() {
  function openRoute(route: string) {
    window.open(route, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="admin-view templates-admin-view">
      <SectionTitle
        eyebrow="Templates"
        title="Templates Signature Digital"
        text="Accès rapide aux templates vivants réutilisables depuis l’admin."
      />

      <Card className="detail-block template-admin-card">
        <div>
          <p className="sd-eyebrow">Template officiel</p>
          <h2>Template Signature Immobilier</h2>
          <p>
            Template vivant basé sur la maquette Lovable Opus Domus, configurable pour les agences immobilières.
          </p>
          <div className="template-route-list">
            <span>{templateRoutes.public}</span>
            <span>{templateRoutes.seller}</span>
            <span>{templateRoutes.agent}</span>
            <span>{templateRoutes.owner}</span>
            <span>{templateRoutes.login}</span>
          </div>
        </div>
        <div className="template-action-grid">
          <Button onClick={() => openRoute(templateRoutes.public)}>Voir la template vivante</Button>
          <Button variant="secondary" onClick={() => openRoute(templateRoutes.seller)}>Ouvrir espace vendeur</Button>
          <Button variant="secondary" onClick={() => openRoute(templateRoutes.agent)}>Ouvrir espace agent</Button>
          <Button variant="secondary" onClick={() => openRoute(templateRoutes.owner)}>Ouvrir espace patron</Button>
          <Button variant="secondary" onClick={() => openRoute(templateRoutes.login)}>Ouvrir connexion</Button>
        </div>
      </Card>
    </div>
  )
}
