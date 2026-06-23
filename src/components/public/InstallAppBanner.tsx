import { useEffect, useState } from 'react'
import { Button, Card } from '../shared/DesignSystem'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type InstallAppBannerProps = {
  variant?: 'banner' | 'card'
  dismissible?: boolean
  title?: string
  text?: string
  installLabel?: string
}

const dismissedKey = 'signature-digital-install-banner-dismissed'

export function InstallAppBanner({
  variant = 'banner',
  dismissible = true,
  title = 'Installer Signature Digital',
  text = 'Accédez plus vite à votre espace, suivez votre démo et retrouvez vos prochaines étapes comme dans une application.',
  installLabel = 'Installer',
}: InstallAppBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(() => shouldShowInstallPrompt(variant))
  const [helpVisible, setHelpVisible] = useState(false)

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(shouldShowInstallPrompt(variant))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [variant])

  async function installApp() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)

      if (choice.outcome === 'accepted') {
        window.localStorage.setItem(dismissedKey, 'installed')
        setVisible(false)
      }

      return
    }

    setHelpVisible(true)
  }

  function dismiss() {
    window.localStorage.setItem(dismissedKey, String(Date.now()))
    setVisible(false)
  }

  if (!visible) return null

  const content = (
    <>
      <div className="install-banner-copy">
        <span className="install-app-icon" aria-hidden="true">SD</span>
        <div>
          <strong>{title}</strong>
          <p>{text}</p>
        </div>
      </div>
      <div className="install-banner-actions">
        <Button onClick={installApp}>{installLabel}</Button>
        {dismissible && <Button variant="ghost" onClick={dismiss}>Plus tard</Button>}
      </div>
      {helpVisible && (
        <div className="install-help-panel">
          <strong>Ajouter à l’écran d’accueil</strong>
          <p>Sur iPhone, ouvrez le menu Partager de Safari, puis choisissez “Ajouter à l’écran d’accueil”.</p>
        </div>
      )}
    </>
  )

  if (variant === 'card') {
    return <Card className="install-app-card">{content}</Card>
  }

  return <section className="install-app-banner">{content}</section>
}

function shouldShowInstallPrompt(variant: 'banner' | 'card') {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return false
  if ('standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)) return false
  if (variant === 'banner' && window.localStorage.getItem(dismissedKey)) return false

  return true
}
