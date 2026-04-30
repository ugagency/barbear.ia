'use client'

import { useEffect, useState } from 'react'
import { CheckCheck, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Mensagem {
  autor: 'cliente' | 'ia'
  texto: string
  hora: string
}

const CONVERSA: Mensagem[] = [
  { autor: 'cliente', texto: 'Oi, tem horário amanhã de tarde?', hora: '20:43' },
  {
    autor: 'ia',
    texto: 'Tenho sim! 14h ou 15h30. Qual prefere? 💈',
    hora: '20:43',
  },
  { autor: 'cliente', texto: '15:30 pode ser', hora: '20:44' },
  {
    autor: 'ia',
    texto: 'Agendado! ✅ Te lembro 1 hora antes 👍',
    hora: '20:44',
  },
]

export function WhatsappMockup() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative max-w-sm mx-auto">
      {/* glow */}
      <div
        aria-hidden
        className="absolute -inset-6 bg-gradient-to-tr from-brand/20 via-brand/5 to-transparent blur-2xl rounded-[3rem]"
      />
      <div className="relative rounded-[2rem] bg-slate-900 p-2 shadow-2xl ring-1 ring-white/10">
        <div className="rounded-[1.6rem] overflow-hidden bg-[#0b141a]">
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#202c33] px-4 py-3">
            <div className="size-9 rounded-full bg-brand flex items-center justify-center">
              <Scissors className="size-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Barbearia New House
              </p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
                online
              </p>
            </div>
          </div>

          {/* Background pattern */}
          <div className="relative bg-[#0b141a] px-3 py-4 min-h-[360px] [background-image:radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:20px_20px]">
            <ul className="space-y-2 relative">
              {CONVERSA.map((m, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'flex',
                    m.autor === 'ia' ? 'justify-end' : 'justify-start',
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                    'transition-all duration-500 ease-out',
                  )}
                  style={{
                    transitionDelay: mounted ? `${idx * 700}ms` : '0ms',
                  }}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm',
                      m.autor === 'ia'
                        ? 'bg-[#005c4b] text-white rounded-tr-sm'
                        : 'bg-[#202c33] text-white rounded-tl-sm',
                    )}
                  >
                    <p className="leading-relaxed">{m.texto}</p>
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/60">
                      <span>{m.hora}</span>
                      {m.autor === 'ia' && (
                        <CheckCheck className="size-3 text-sky-400" />
                      )}
                    </div>
                  </div>
                </li>
              ))}

              {/* "digitando..." indicator */}
              <li
                className={cn(
                  'flex justify-end transition-opacity duration-500',
                  mounted ? 'opacity-0' : 'opacity-0',
                )}
                aria-hidden
              />
            </ul>
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2">
            <div className="flex-1 h-9 rounded-full bg-[#2a3942]" />
            <div className="size-9 rounded-full bg-[#005c4b]" />
          </div>
        </div>
      </div>
    </div>
  )
}
