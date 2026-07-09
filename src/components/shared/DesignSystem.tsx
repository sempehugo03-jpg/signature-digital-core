import type { ReactNode } from 'react'
import { projectStatusLabels } from '../../data/projectStore'
import type { ProjectStatus } from '../../data/projectStore'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'icon' | 'floating'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      className={`sd-button sd-button-${variant} ${className}`}
      data-loading={loading || undefined}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <span className="sd-button-label">{children}</span>
    </button>
  )
}

export function Card({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <article className={`sd-card ${className}`} id={id}>{children}</article>
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'violet' | 'green' | 'amber' }) {
  return <span className={`sd-badge sd-badge-${tone}`}>{children}</span>
}

const statusTone: Record<ProjectStatus, 'default' | 'violet' | 'green' | 'amber'> = {
  request_received: 'violet',
  analysis_to_do: 'amber',
  lovable_demo_ready: 'violet',
  demo_sent: 'violet',
  demo_validated: 'green',
  live_demo_to_prepare: 'amber',
  active: 'green',
  lost: 'default',
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={statusTone[status]}>{projectStatusLabels[status]}</Badge>
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
      {options.map((option) => {
        const isSelected = selected.includes(option)

        return (
        <button
          className={isSelected ? 'choice-pill active' : 'choice-pill'}
          key={option}
          type="button"
          onClick={() => onToggle(option)}
        >
          <span>{option}</span>
          {isSelected && <i className="choice-check">✓</i>}
        </button>
        )
      })}
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
