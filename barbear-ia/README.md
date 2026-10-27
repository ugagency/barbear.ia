This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Importar onboarding por texto ou PDF

Na gestão interna, abra uma barbearia e use **Importar respostas do onboarding**. Aceita texto (até 60 mil caracteres), PDF (até 3 MB) ou ambos. A extração produz um rascunho com pendências e trechos de referência. Os botões de salvar de cada seção continuam necessários. Profissionais identificados são revisados e salvos individualmente, com seleção explícita antes de substituir alguém já cadastrado.

A API `/api/gestao/extrair-onboarding` exige `platform_admins`. Não grava o texto original ou o PDF. Usa AI SDK 7 (Node.js 22+) com `@ai-sdk/google`, conectando diretamente a `generativelanguage.googleapis.com`, sem AI Gateway ou OIDC.

Configure `GOOGLE_GENERATIVE_AI_API_KEY` como segredo somente no servidor, em Settings → Environment Variables do projeto Vercel, nos ambientes Production e Preview. Obtenha a chave em https://aistudio.google.com/apikey e publique novamente após cadastrá-la. Nunca use prefixo `NEXT_PUBLIC_` ou inclua a chave no repositório. Para desenvolvimento, use uma chave própria em `.env.local` (ignorado pelo Git).

O modelo padrão é `gemini-3.8-flash`, com suporte a texto, PDF e saída estruturada. `ONBOARDING_AI_MODEL` permite escolher outro modelo Google compatível; o prefixo legado `google/` é removido para compatibilidade. Não é necessário alterar o banco. Campos ausentes ficam pendentes; dados existentes são preservados por padrão. Os testes usam respostas simuladas, incluindo uma chamada com o provedor real e transporte HTTP simulado para verificar o destino Google e o envio de PDFs, sem consumo de API.

Para operar sem cobrança, mantenha o projeto Google associado à chave no Free Tier, sem habilitar faturamento pago. O aplicativo não altera o plano Google nem usa outro provedor como fallback. Ao atingir a cota, a leitura retorna uma mensagem de limite; escolher um modelo com faixa gratuita não garante gratuidade em um projeto com faturamento habilitado. Confira a cota ativa em https://aistudio.google.com/rate-limit.

O esquema amplo de onboarding é descrito no prompt, com JSON obrigatório (`structuredOutputs: false` no provedor Google) para evitar a limitação de complexidade do esquema nativo. O AI SDK e Zod continuam validando todos os campos antes de devolver o rascunho. Há no máximo uma repetição para erros transitórios pelo SDK, dentro do mesmo limite de tempo, sem trocar de modelo/provedor. Erros 503/504 do Google são exibidos como indisponibilidade temporária.
