import { useState } from 'react'
import { buildWhatsAppShareUrl, copyToClipboard } from '../utils/whatsapp.js'

export default function CopyToWhatsAppButton({ text, label = 'Copiar para WhatsApp' }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const ok = await copyToClipboard(text)
    setCopied(ok)
    if (ok) setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition"
      >
        {copied ? 'Copiado ✓' : label}
      </button>
      <a
        href={buildWhatsAppShareUrl(text)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
      >
        Enviar por WhatsApp
      </a>
    </div>
  )
}
