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

A API `/api/gestao/extrair-onboarding` exige `platform_admins`. Não grava o texto original ou o PDF. Usa AI SDK 7 (Node.js 22+) e AI Gateway. No Vercel, o SDK resolve OIDC pelo contexto confiável da requisição ou pela variável `VERCEL_OIDC_TOKEN` — esta variável não é obrigatória quando o contexto está presente; fora dele, configure `AI_GATEWAY_API_KEY` somente no servidor. O Gateway precisa estar autorizado e com créditos disponíveis. A interface informa falhas de configuração e de limite de uso.

O modelo padrão é `google/gemini-2.5-flash`, verificado no catálogo do Gateway com suporte a texto, PDF e saída estruturada. `ONBOARDING_AI_MODEL` permite escolher outro modelo que suporte esses recursos. Não é necessário alterar o banco para esta função. Campos ausentes ficam pendentes; dados existentes são preservados por padrão. Sem credenciais locais, testes usam respostas simuladas do modelo, sem chamada paga.

Validação: `node --test tests/*.test.cjs`, `npx tsc --noEmit`, `npm run build`.
