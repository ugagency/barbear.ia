import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/login', '/cadastro']
const APP_ROUTES = ['/agenda', '/clientes', '/configuracoes', '/metricas']
// /configuracoes NÃO está aqui — usuário inadimplente precisa conseguir pagar
const PLAN_PROTECTED = ['/agenda', '/clientes', '/metricas']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redireciona não-autenticados para o login
  if (!user && APP_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redireciona autenticados para longe das rotas de auth
  if (user && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/agenda', request.url))
  }

  // Verifica plano nas rotas protegidas por plano
  if (user && PLAN_PROTECTED.some((r) => pathname.startsWith(r))) {
    const { data: vinculo } = await supabase
      .from('usuarios_barbearias')
      .select('barbearia_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (vinculo) {
      const { data: barbearia } = await supabase
        .from('barbearias')
        .select('plano, plano_status, trial_ends_at')
        .eq('id', vinculo.barbearia_id)
        .maybeSingle()

      if (barbearia) {
        const now = new Date()
        const trialExpirado =
          barbearia.plano === 'trial' &&
          barbearia.trial_ends_at != null &&
          new Date(barbearia.trial_ends_at as string) < now

        const inadimplente = barbearia.plano_status === 'inadimplente'

        if (trialExpirado || inadimplente) {
          return NextResponse.redirect(new URL('/plano-vencido', request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/agenda/:path*',
    '/clientes/:path*',
    '/configuracoes/:path*',
    '/metricas/:path*',
    '/login',
    '/cadastro',
  ],
}
