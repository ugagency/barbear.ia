# Google Agenda por barbeiro

A conexão fica em **Configurações → Barbeiros → Editar → Google Agenda**. O dono da barbearia abre a autorização e escolhe a conta Google do profissional. É criada uma agenda secundária `Barbear.IA — Nome` nessa conta. A permissão `calendar.app.created` permite administrar somente agendas criadas pelo aplicativo.

## Comportamento entregue

- Sentido único: Barbear.IA → Google. Criação, remarcação, cancelamento e exclusão de agendamentos são refletidos na agenda conectada.
- Ao conectar, importa os agendamentos existentes cujo término ainda não passou.
- Conexões independentes por profissional, fila durável e reenvio com espera progressiva.
- Alterações feitas no painel e no agendamento público tentam enviar após a resposta. Alterações pelo n8n e falhas são processadas pelo worker periódico.
- IDs determinísticos evitam duplicar eventos em tentativas repetidas. Revisões impedem que um envio apague uma alteração mais recente da fila. Uma concessão temporária por profissional impede workers concorrentes.
- Apenas nome do cliente, serviço e horários são enviados. Telefones, observações e valores não são enviados.
- Ao desconectar, remove credencial e pendências locais. Os eventos permanecem no Google. O usuário pode remover a agenda pelo Google. Reconectar cria uma nova agenda; remova a anterior se necessário.
- Bloqueios, horários fixos recorrentes e compromissos pessoais do Google não são importados/exportados por esta integração. Alterações de clientes diretamente no banco não reenfileiram automaticamente eventos; o título será atualizado na próxima alteração do agendamento.
- O campo legado `barbeiros.calendar_id` é preservado para compatibilidade com fluxos n8n existentes; esta integração não o usa. Desative gravações do fluxo legado no Google para evitar dois mecanismos enviando o mesmo atendimento.

## Ativação

1. Aplicar `migrations/20261027000301_google_calendar_sync.sql` ao Supabase. A migration foi aplicada no projeto `oapssmtckluitrsotydv` durante a implementação. Não reaplicar nesse projeto. Dados de teste foram revertidos na mesma transação.
2. Criar um cliente OAuth **Aplicativo da Web** no projeto Google Cloud da Spictur, habilitar Calendar API e configurar a tela de consentimento. Registrar o escopo `https://www.googleapis.com/auth/calendar.app.created`.
3. Cadastrar a URI autorizada de redirecionamento exata, por exemplo `https://barbearai.vercel.app/api/google-calendar/callback`.
4. Definir as variáveis de servidor no ambiente do app:
   - `GOOGLE_CALENDAR_CLIENT_ID`
   - `GOOGLE_CALENDAR_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_REDIRECT_URI` (igual à URI cadastrada)
   - `GOOGLE_CALENDAR_TOKEN_KEY` (64 caracteres hexadecimais aleatórios / 32 bytes; guardar sem rotacionar sem migrar os tokens existentes)
   - `GOOGLE_CALENDAR_SYNC_SECRET` (segredo aleatório exclusivo do worker)
   - As variáveis Supabase do projeto já utilizadas pelo app, incluindo service role somente no servidor.
5. Publicar a versão e configurar uma rotina no n8n a cada minuto: HTTP **POST** para `/api/google-calendar/sync`, com header `Authorization: Bearer <GOOGLE_CALENDAR_SYNC_SECRET>`. O endpoint processa lotes limitados e pode ser chamado repetidamente para drenar a fila. Uma fila grande pode exigir frequência maior.
6. Conectar uma conta de teste pelo cadastro do barbeiro e validar os itens abaixo antes da liberação.

Não há cron Vercel adicionado. Sem o worker periódico, envios feitos pelo n8n e tentativas que falharam só avançam ao usar **Sincronizar agora** ou em uma nova operação no painel.

## Validação

- `npx tsc --noEmit`.
- `node --test tests/google-calendar.test.mjs` (HTTP Google simulado; não substitui OAuth real).
- `tests/google-calendar-queue.sql` com fixtures transacionais e rollback: backfill, revisões concorrentes, cancelamento, troca de barbeiro, exclusão, desconexão e isolamento de tokens.
- Conta Google real: conectar → criar atendimento no painel, página pública e WhatsApp → conferir data e duração → remarcar → cancelar → conferir remoção → desconectar. Recusar consentimento, expirar sessão e tentar outro tenant devem impedir conexão. Revogar o acesso pelo Google deve exibir erro e preservar a fila.
- O lint global da base já apresenta erros em componentes existentes. Executar lint dos arquivos novos/alterados para identificar regressões.

## Segurança e operação

Credenciais ficam cifradas com AES-256-GCM no banco, sem permissões para `anon`/`authenticated`. Ações de conexão e status verificam a sessão e o papel `dono` na barbearia. OAuth usa state, PKCE e cookie HttpOnly de dez minutos vinculado ao usuário e profissional. Funções de trigger ficam no schema privado e não podem ser executadas pelos clientes.

Falhas são preservadas na fila. Erros de autorização pedem reconexão. Não se revoga automaticamente o grant Google na desconexão local porque outros profissionais podem compartilhar a mesma conta e grant. O usuário pode revogar o acesso completo nas configurações de segurança da conta Google.

Referências: https://developers.google.com/identity/protocols/oauth2/web-server ; https://developers.google.com/workspace/calendar/api/auth ; https://developers.google.com/workspace/calendar/api/guides/create-events .
