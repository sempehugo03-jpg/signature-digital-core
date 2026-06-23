import type { ReactNode } from 'react'
import type { ProjectStatus } from '../../data/projectStore'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <button className={`sd-button sd-button-${variant} ${className}`} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <article className={`sd-card ${className}`}>{children}</article>
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'violet' | 'green' | 'amber' }) {
  return <span className={`sd-badge sd-badge-${tone}`}>{children}</span>
}

const statusTone: Record<ProjectStatus, 'default' | 'violet' | 'green' | 'amber'> = {
  'Demande reçue': 'violet',
  'À analyser': 'amber',
  'Analyse faite': 'default',
  'Démo à créer': 'amber',
  'Démo visuelle prête': 'violet',
  'Visuel validé': 'green',
  'Codex à lancer': 'amber',
  'Démo vivante prête': 'green',
  'Démo envoyée': 'violet',
  'Paiement envoyé': 'amber',
  'Paiement reçu': 'green',
  'À activer': 'amber',
  'Activé': 'green',
  'Perdu': 'default',
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>
}

export function SectionTitle({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="sd-section-title">
      {eyebrow && <p className="sd-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}

export function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="sd-field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="sd-field">
      <span>{label}</span>
      <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export function ChoiceGrid({
  options,
  selected,
  onToggle,
  multiple = false,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  multiple?: boolean
}) {
  return (
    <div className="choice-grid" data-multiple={multiple}>
      {options.map((option) => (
        <button
          className={selected.includes(option) ? 'choice-pill active' : 'choice-pill'}
          key={option}
          type="button"
          onClick={() => onToggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export function Timeline({ items }: { items: Array<{ label: string; done: boolean }> }) {
  return (
    <div className="sd-timeline">
      {items.map((item) => (
        <div className={item.done ? 'timeline-item done' : 'timeline-item'} key={item.label}>
          <span />
          <p>{item.label}</p>
        </div>
      ))}
    </div>
  )
}
