Adendo de Design — Identidade Visual Barbear.IA

Anexe este arquivo junto com qualquer prompt do Antigravity para garantir consistência visual.


Cores da marca
css/* Variáveis de cor — aplicar no tailwind.config.ts e globals.css */

--barbear-navy: #0A1F44;        /* Cor primária — azul marinho escuro */
--barbear-navy-light: #132D5E;  /* Hover / estados ativos */
--barbear-navy-dark: #061430;   /* Backgrounds profundos */
--barbear-navy-50: #E8EDF5;     /* Backgrounds sutis */
--barbear-navy-100: #C5D0E3;    /* Borders, dividers */
--barbear-white: #FFFFFF;       /* Texto sobre navy */
--barbear-gray: #64748B;        /* Texto secundário */
--barbear-bg: #F8FAFC;          /* Background claro das páginas */
Aplicação no Tailwind
No tailwind.config.ts, estender as cores:
typescripttheme: {
  extend: {
    colors: {
      brand: {
        DEFAULT: '#0A1F44',
        light: '#132D5E',
        dark: '#061430',
        50: '#E8EDF5',
        100: '#C5D0E3',
      }
    }
  }
}
Regras de design

Sidebar do dashboard: fundo brand (#0A1F44), texto branco, links com hover brand-light
Botões primários: fundo brand, texto branco, hover brand-light
Logo: usar a imagem /logo-white.png na sidebar (versão branca) e /logo.png nas páginas de auth/marketing (versão azul)
Títulos e headings: cor brand (#0A1F44) em fundos claros
Cards e superfícies: branco com border sutil brand-100
Badges de plano:

Trial: bg-amber-100 text-amber-800
Starter: bg-brand-50 text-brand
Pro: bg-brand text-white


Páginas de auth (login/cadastro/onboarding): fundo brand-dark ou brand, card branco centralizado, logo versão branca no topo
Landing page: seções alternando fundo branco e brand-50, CTAs em brand

Fontes

Headings: Inter, font-weight 700
Body: Inter, font-weight 400
Monospace (código/preços): font-mono do Tailwind