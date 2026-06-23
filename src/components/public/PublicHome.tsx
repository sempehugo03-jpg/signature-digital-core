import { Button, Card, SectionTitle } from '../shared/DesignSystem'

type Navigate = (route: string) => void

const painItems = [
  'Image pas assez premium',
  'Message pas assez clair',
  'Manque de confiance',
  'Parcours client trop flou',
  'Peu de demandes entrantes',
  'Pas d’expérience différenciante',
]

const sectors = [
  'Immobilier',
  'Constructeurs',
  'Architectes',
  'Avocats',
  'Notaires',
  'Courtiers',
  'Cliniques privées',
  'Services premium',
]

export function PublicHome({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <main className="public-page">
      <section className="lovable-hero">
        <div className="hero-copy">
          <p className="sd-eyebrow">Signature Digital</p>
          <h1>Votre site montre-t-il vraiment pourquoi vos clients devraient vous choisir&nbsp;?</h1>
          <p>
            Votre présence digitale peut être belle, mais ne pas assez rassurer, guider ou convertir. Signature
            Digital révèle ce qui bloque aujourd’hui, puis prépare une démo pensée pour corriger ce point.
          </p>
          <div className="hero-actions">
            <Button onClick={() => onNavigate('/analyser-mon-site')}>Analyser mon site</Button>
            <Button variant="secondary" onClick={() => scrollToSection('fonctionnement')}>Voir le fonctionnement</Button>
          </div>
        </div>
        <Card className="hero-flow-card">
          {[
            ['01', 'Vous renseignez votre site', 'En quelques secondes, depuis votre téléphone.'],
            ['02', 'Vous exprimez ce qui bloque', 'La douleur réelle, pas une checklist générique.'],
            ['03', 'Vous recevez une démo dédiée', 'Pensée autour de votre vraie difficulté.'],
          ].map(([number, title, text]) => (
            <div className="flow-row" key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section className="split-section">
        <SectionTitle
          eyebrow="La réalité"
          title="Un site peut être correct… et pourtant vous faire perdre des demandes."
          text="Quand un visiteur ne comprend pas rapidement votre valeur, il quitte le site, compare ailleurs, puis contacte souvent un concurrent plus clair, plus rassurant ou plus premium."
        />
        <Card className="pain-card">
          {painItems.map((item) => <span key={item}>{item}</span>)}
        </Card>
      </section>

      <section className="dark-band">
        <SectionTitle
          eyebrow="Prise de conscience"
          title="Le problème n’est pas toujours le design."
          text="Le vrai problème, c’est l’écart entre la valeur réelle de votre entreprise et ce que votre site fait ressentir en quelques secondes."
        />
      </section>

      <section className="split-section">
        <SectionTitle
          eyebrow="La réponse"
          title="Votre démo sera construite autour de ce qui bloque aujourd’hui."
          text="À partir de votre activité, de votre site actuel et de vos réponses, Signature Digital prépare une démo personnalisée pour montrer comment votre expérience digitale pourrait devenir plus claire, plus crédible et plus efficace."
        />
        <Card className="premium-proof">
          <p>Démo personnalisée</p>
          <strong>Pas un modèle générique.</strong>
          <span>Un angle, une promesse et un parcours pensés pour votre vraie douleur actuelle.</span>
        </Card>
      </section>

      <section className="process-section" id="fonctionnement">
        <SectionTitle eyebrow="Fonctionnement" title="Une démarche fluide, en six temps." />
        <div className="process-list">
          {[
            'Vous renseignez votre site actuel',
            'Vous identifiez ce qui bloque aujourd’hui',
            'Vous indiquez ce que vous voulez améliorer',
            'Nous préparons une démo personnalisée',
            'Vous la découvrez',
            'Si elle vous convient, elle peut être activée',
          ].map((step, index) => (
            <Card className="process-card" key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </Card>
          ))}
        </div>
        <Button onClick={() => onNavigate('/analyser-mon-site')}>Commencer mon analyse</Button>
      </section>

      <section className="sectors-section" id="secteurs">
        <SectionTitle eyebrow="Pensé pour" title="Les activités où l’image et la confiance font la différence." />
        <div className="sector-grid">
          {sectors.map((sector) => <span key={sector}>{sector}</span>)}
        </div>
      </section>

      <section className="final-cta">
        <h2>Découvrez à quoi pourrait ressembler votre site, vraiment à votre niveau.</h2>
        <p>Une démo personnalisée, sans engagement, pensée autour de votre activité.</p>
        <Button onClick={() => onNavigate('/analyser-mon-site')}>Analyser mon site</Button>
      </section>
    </main>
  )
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
