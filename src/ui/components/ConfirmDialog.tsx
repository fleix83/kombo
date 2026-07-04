import { de } from '../i18n/de'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = de.common.confirm,
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  text: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-zinc-600">{text}</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" full onClick={onCancel} disabled={busy}>
            {de.common.cancel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} full onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
