import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { blockUser } from '../core/api/blocks'
import { createReport } from '../core/api/reports'
import { calcAge } from '../core/logic/age'
import { useChatStore } from '../core/store/chatStore'
import { useMatchesStore } from '../core/store/matchesStore'
import type { Message } from '../core/types/db'
import { Button } from '../ui/components/Button'
import { CardHeaderDoodle } from '../ui/components/CardView'
import { ConfirmDialog } from '../ui/components/ConfirmDialog'
import { Doodle } from '../ui/components/Doodle'
import { TextArea } from '../ui/components/Field'
import { LoadingScreen } from '../ui/components/Spinner'
import { TypeBadge } from '../ui/components/TypeBadge'
import { de } from '../ui/i18n/de'

const timeFormat = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long' })

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          mine ? 'rounded-br-md bg-zinc-900 text-white' : 'rounded-bl-md bg-zinc-100 text-zinc-900'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {timeFormat.format(new Date(message.created_at))}
        </p>
      </div>
    </div>
  )
}

export function ChatPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()

  const chat = useChatStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (matchId) void useChatStore.getState().load(matchId)
    return () => useChatStore.getState().reset()
  }, [matchId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat.messages.length])

  if (chat.loading || (!chat.counterpart && !chat.notFound)) return <LoadingScreen />

  if (chat.notFound || !chat.counterpart) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-zinc-500">{de.chat.notFound}</p>
        <Link to="/matches" className="mt-4 text-sm underline">
          {de.common.back}
        </Link>
      </div>
    )
  }

  const counterpart = chat.counterpart
  const owner = counterpart.owner
  const archived = chat.matchStatus === 'archived'

  async function onSend(e: FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || content.length > 2000 || busy) return
    setBusy(true)
    try {
      await chat.send(content)
      setDraft('')
    } catch {
      // keep draft so nothing is lost
    } finally {
      setBusy(false)
    }
  }

  async function onBlock() {
    setBusy(true)
    try {
      await blockUser(owner.id)
      chat.setArchived()
      await useMatchesStore.getState().load().catch(() => undefined)
      setConfirmBlock(false)
      setMenuOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function onReport() {
    if (!reportReason.trim()) return
    setBusy(true)
    try {
      await createReport({
        reportedUserId: owner.id,
        reportedCardId: counterpart.id,
        reason: reportReason.trim(),
      })
      setReportSent(true)
      setReportReason('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-1 flex-col">
      {/* header (PRD §5.6): counterpart card + overflow menu */}
      <header className="flex items-center gap-2 border-b border-zinc-200 p-3">
        <button type="button" onClick={() => navigate('/matches')} className="p-1 text-zinc-500" aria-label={de.common.back}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setShowCard(true)}
        >
          <Doodle url={counterpart.drawing_url ?? owner.drawing_url} className="h-9 w-9" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{owner.display_name}</span>
            <span className="block truncate text-xs text-zinc-500">{counterpart.title}</span>
          </span>
        </button>
        <div className="relative">
          <button
            type="button"
            className="p-2 text-zinc-500"
            aria-label="Menü"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmBlock(true)
                }}
              >
                {de.safety.block}
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50"
                onClick={() => {
                  setMenuOpen(false)
                  setReportOpen(true)
                  setReportSent(false)
                }}
              >
                {de.safety.report}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {chat.messages.map((message) => (
          <Bubble key={message.id} message={message} mine={message.sender_id === chat.myUserId} />
        ))}
      </div>

      {/* composer / archived banner */}
      {archived ? (
        <div className="border-t border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
          {de.chat.archivedBanner}
        </div>
      ) : (
        <form onSubmit={onSend} className="flex items-end gap-2 border-t border-zinc-200 p-3">
          <TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={de.chat.placeholder}
            maxLength={2000}
            rows={1}
            className="min-h-0 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void onSend(e)
              }
            }}
          />
          <Button type="submit" disabled={!draft.trim()} busy={busy}>
            {de.chat.send}
          </Button>
        </form>
      )}

      {/* counterpart card detail */}
      {showCard && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6"
          role="dialog"
          aria-modal
          onClick={() => setShowCard(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-40 overflow-hidden border-b border-zinc-100 bg-zinc-50">
              <CardHeaderDoodle url={counterpart.drawing_url} fallbackUrl={owner.drawing_url} />
            </div>
            <div className="p-4">
              <TypeBadge type={counterpart.type} />
              <h2 className="mt-2 text-lg font-semibold">{counterpart.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
                {counterpart.description}
              </p>
              <p className="mt-4 text-sm text-zinc-600">
                <span className="font-medium text-zinc-900">
                  {owner.display_name}, {calcAge(owner.birth_date)}
                </span>
                {' · '}
                {counterpart.city}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {dayFormat.format(new Date(chat.messages[0]?.created_at ?? counterpart.created_at))}
              </p>
              <Button variant="secondary" full className="mt-4" onClick={() => setShowCard(false)}>
                {de.common.back}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* block confirm */}
      <ConfirmDialog
        open={confirmBlock}
        title={de.safety.blockTitle}
        text={de.safety.blockText}
        confirmLabel={de.safety.block}
        danger
        busy={busy}
        onConfirm={() => void onBlock()}
        onCancel={() => setConfirmBlock(false)}
      />

      {/* report dialog */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="text-base font-semibold">{de.safety.reportTitle}</h2>
            {reportSent ? (
              <>
                <p className="mt-2 text-sm text-zinc-600">{de.safety.reportSent}</p>
                <Button full className="mt-5" onClick={() => setReportOpen(false)}>
                  OK
                </Button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-zinc-600">{de.safety.reportText}</p>
                <TextArea
                  className="mt-3"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  maxLength={1000}
                  placeholder={de.safety.reportReason}
                />
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" full onClick={() => setReportOpen(false)} disabled={busy}>
                    {de.common.cancel}
                  </Button>
                  <Button full onClick={() => void onReport()} busy={busy} disabled={!reportReason.trim()}>
                    {de.safety.report}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
