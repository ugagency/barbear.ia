'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Barbearia, Barbeiro } from '@/types'

interface BarbeariaCache {
  barbearia: Barbearia | null
  barbeiros: Barbeiro[]
}

let cache: BarbeariaCache | null = null
let inflight: Promise<BarbeariaCache> | null = null

async function fetchBarbearia(): Promise<BarbeariaCache> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { barbearia: null, barbeiros: [] }

  const { data: vinculo } = await supabase
    .from('usuarios_barbearias')
    .select('barbearia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!vinculo) return { barbearia: null, barbeiros: [] }

  const [barbeariaRes, barbeirosRes] = await Promise.all([
    supabase
      .from('barbearias')
      .select('*')
      .eq('id', vinculo.barbearia_id)
      .single(),
    supabase
      .from('barbeiros')
      .select('*')
      .eq('barbearia_id', vinculo.barbearia_id)
      .order('created_at', { ascending: true }),
  ])

  return {
    barbearia: (barbeariaRes.data as Barbearia | null) ?? null,
    barbeiros: (barbeirosRes.data as Barbeiro[] | null) ?? [],
  }
}

export function useBarbearia() {
  const [data, setData] = useState<BarbeariaCache | null>(cache)
  const [isLoading, setIsLoading] = useState(!cache)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (cache) {
      setData(cache)
      setIsLoading(false)
      return
    }

    let cancelled = false
    const promise = inflight ?? (inflight = fetchBarbearia())

    promise
      .then((result) => {
        cache = result
        inflight = null
        if (!cancelled) {
          setData(result)
          setIsLoading(false)
        }
      })
      .catch((err: Error) => {
        inflight = null
        if (!cancelled) {
          setError(err)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    barbearia: data?.barbearia ?? null,
    barbeiros: data?.barbeiros ?? [],
    isLoading,
    error,
  }
}

export function clearBarbeariaCache() {
  cache = null
  inflight = null
}
