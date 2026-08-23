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
        className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-emerald-700 text-emerald-800 font-mono text-sm tracking-wide hover:bg-emerald-50 transition"
      >
        {copied ? 'Copiado ✓' : label}
      </button>
      <a
        href={buildWhatsAppShareUrl(text)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-emerald-700 text-white font-mono text-sm tracking-wide hover:bg-emerald-800 transition"
      >
        Enviar por WhatsApp
      </a>
    </div>
  )
}
