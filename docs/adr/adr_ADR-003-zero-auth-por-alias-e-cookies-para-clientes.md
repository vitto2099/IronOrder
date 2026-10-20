# ADR-003: Autenticação Zero-Auth por Alias e Cookies para Clientes

## Contexto

O fluxo de atendimento em bares e restaurantes exige baixíssima fricção. Exigir que clientes criem conta com e-mail/senha ou aguardem códigos SMS/WhatsApp (OTP) antes de visualizar o cardápio ou pedir um chopp gera desistência imediata e sobrecarga no atendimento.

Ao mesmo tempo, o estabelecimento precisa diferenciar quem consumiu o quê na mesma mesa para permitir a divisão transparente da comanda no fechamento.

## Decisão

1. O fluxo de acesso do cliente não exige cadastro prévio (**Zero-Auth**).
2. Ao ler o QR Code da mesa (`/m/:tableId`), o cliente informa apenas um apelido/nome (ex: "Carlos").
3. O servidor emite um cookie de sessão criptografado (`tab_session`) contendo o identificador do membro (`member_id`) associado à comanda ativa daquela mesa física.
4. Toda requisição subsequente do cliente utiliza esse cookie para assinar e atribuir os pedidos ao seu respectivo alias.
5. O painel administrativo e operacional (Garçom, Cozinha, Admin) permanece protegido pelo sistema tradicional de autenticação de sessão `@adonisjs/auth`.

## Alternativas Consideradas

- **Autenticação via Telefone/SMS (OTP):** Descartada pelo custo de provedores de SMS, dependência de internet externa e lentidão no onboarding da mesa.
- **Comanda Única Anônima por Mesa (sem nomes):** Descartada porque não resolve a dor crítica do restaurante de divisão de contas entre amigos.
- **Tokens Temporários Impressos no QR Code:** Descartada na primeira fase para simplificar o MVP (os QR Codes físicos serão estáticos por mesa).

## Consequências

| Aspecto                    | Impacto Positivo (+)                                                                                   | Impacto Negativo / Risco (-)                                                           | Mitigação                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Adoção pelo Cliente**    | Entrada em menos de 3 segundos: escanear, digitar o nome e começar a pedir.                            | Possibilidade de nomes duplicados na mesma mesa (ex: dois "Lucas").                    | O backend valida unicidade de alias na mesa ativa ou adiciona sufixo numérico automático ("Lucas (2)").                                |
| **Segurança & Spoofing**   | Proteção por cookies HttpOnly assinados pelo AdonisJS impede manipulação do ID do membro pelo cliente. | Um cliente pode acessar a URL de outra mesa se souber o número e não estiver no local. | Operação local no salão; pedidos falsos são mitigados pela validação visual do garçom antes da preparação ou liberação manual da mesa. |
| **Persistência de Sessão** | Se o celular recarregar a página ou cair a conexão, o cliente permanece na comanda da mesa.            | Limpeza do cookie necessária quando a mesa é encerrada e liberada pelo caixa.          | O middleware invalida o cookie local se a comanda vinculada já estiver com status `FECHADA`.                                           |
