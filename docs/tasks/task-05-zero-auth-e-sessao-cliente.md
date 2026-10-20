# TASK-05: TabSessionModule - Zero-Auth via QR Code, Cookies e ClientSessionMiddleware

- **ID:** `TASK-05`
- **Feature:** `FEATURE-03: TabSessionModule (Gestão de Mesas, Comandas e Membros)`
- **Responsável Sugerido:** Dev-2
- **Status:** Planejada
- **Paralelizável:** ✅ Sim (Executa em paralelo com TASK-03 de Admin Catálogo e TASK-07 de KDS)
- **Dependências:** TASK-01, TASK-04

---

## 1. Objetivo e Contexto

Construir a experiência de entrada ultrarrápida do cliente no restaurante (**Zero-Auth**), permitindo que qualquer pessoa escaneie o QR Code fixado na mesa, informe apenas seu apelido/nome (ex: "Mariana") e acesse o cardápio em menos de 3 segundos, sem precisar baixar apps ou preencher senhas (conforme **ADR-003**). Responsável também pela emissão de cookies de sessão assinados e pelo middleware de validação do ciclo de vida da comanda (**RN-01.3**).

---

## 2. Regras de Negócio e Referências

- **RN-01.1 (Primeiro Acesso):** Se a mesa estiver `LIVRE`, primeiro cliente abre a comanda automaticamente ao confirmar o nome.
- **RN-01.2 (Unicidade de Alias):** backend atribui sufixo automático se o nome já estiver em uso na comanda atual.
- **RN-01.3 (Persistência da Sessão):** Cookie de sessão assinado com duração de 12 horas ou até o fechamento da comanda pelo salão.
- **ADR-003 (Zero-Auth):** Utilizar cookies criptografados/assinados `tab_session` (`HttpOnly`, `SameSite: Lax`).

---

## 3. Escopo Técnico Backend

### 3.1. Rotas HTTP (`start/routes.ts`)

```typescript
router.get('/m/:tableNumber', [controllers.ClientSession, 'welcome']).as('client.welcome')
router.post('/m/:tableNumber/join', [controllers.ClientSession, 'join']).as('client.join')
```

### 3.2. Middleware de Sessão do Cliente (`app/middleware/client_session_middleware.ts`)

- Interceptar todas as rotas protegidas do cliente (`/m/:tableNumber/menu`, `/m/:tableNumber/orders`, etc.).
- Ler cookie criptografado `tab_session`:
  - Contém payload assinado: `{ memberId: number, sessionToken: string, tableNumber: number }`.
- Validar se o `TabMember` existe e se sua `Tab` vinculada está com `status === 'ABERTA'`:
  - Se a comanda estiver `FECHADA` ou o cookie for forjado:
    - Executar `response.clearCookie('tab_session')`.
    - Redirecionar para `/m/:tableNumber` com flash message explicativa ("Esta sessão foi finalizada pelo caixa.").
- Se válido, anexar o membro ao contexto HTTP: `ctx.tabMember = member` e permitir o fluxo.
- Registrar em `start/kernel.ts`:
  ```typescript
  clientSession: () => import('#middleware/client_session_middleware')
  ```

### 3.3. Controller (`app/controllers/client/session_controller.ts`)

- `welcome({ params, request, response, inertia })`:
  - Carrega a mesa pelo `params.tableNumber`.
  - Se a mesa não existir, renderiza página 404 amigável de mesa não encontrada.
  - Verifica se o usuário já possui cookie `tab_session` válido para essa mesa. Se tiver, redireciona diretamente para o cardápio (`/m/:tableNumber/menu`).
  - Renderiza `client/welcome` enviando número da mesa e status atual (`isBlocked`: se estiver `CONTA_PEDIDA`).
- `join({ params, request, response })`:
  - Valida payload com `clientAliasValidator` (campo `alias`, min 2, max 30 caracteres).
  - Invoca `TabSessionService.bindAliasToTable(table.id, payload.alias)`.
  - Emite cookie assinado:
    ```typescript
    response.encryptedCookie(
      'tab_session',
      {
        memberId: result.member.id,
        sessionToken: result.member.sessionToken,
        tableNumber: table.number,
      },
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: '12h',
      }
    )
    ```
  - Redireciona para `/m/:tableNumber/menu`.

### 3.4. Validação VineJS (`app/validators/client_session.ts`)

- Schema para entrada do alias:
  ```typescript
  export const joinTableValidator = vine.create({
    alias: vine.string().trim().minLength(2).maxLength(30),
  })
  ```

---

## 4. Escopo Técnico Frontend (Inertia + React)

### 4.1. Página de Onboarding (`inertia/pages/client/welcome.tsx`)

- Design Mobile-First minimalista e acolhedor:
  - Fundo neutro limpo (`bg-[#F6F6F6]`).
  - Ícone/logo do restaurante ou da aplicação ("Mesa+").
  - Identificação destacada da mesa:
    - Card centralizado: "Mesa {tableNumber}".
  - Se a mesa estiver com `status === 'CONTA_PEDIDA'`:
    - Alerta amarelo: "Esta mesa está em processo de fechamento. Peça ao garçom para liberar novos pedidos."
    - Desabilitar botão de entrada.
  - Campo de input estilizado:
    - Label: "Como quer ser chamado na comanda?"
    - Placeholder: "Ex: Carlos, Ana..."
    - Tratamento de erro inline caso o campo esteja em branco.
  - Botão de ação: "Ver Cardápio & Fazer Pedido" (com spinner animado durante o submit).

---

## 5. Critérios de Aceitação

1. **Velocidade de Acesso:** Usuário entra em `/m/5`, digita seu nome, recebe cookie seguro e entra no cardápio.
2. **Persistência Sem Fricção:** Fechar e reabrir o navegador na mesma mesa mantém a sessão sem pedir o nome de novo.
3. **Mesa Encerrada:** Quando a comanda é encerrada, a próxima tentativa de navegação limpa o cookie e volta para a tela de boas-vindas.
4. **Resolução de Conflitos:** Se o usuário entrar com o nome de alguém já na mesa, recebe o nome ajustado sem erro de sistema.

---

## 6. Critérios de Conclusão (DoD)

- [ ] Rotas `/m/:tableNumber` e `/m/:tableNumber/join` implementadas.
- [ ] `ClientSessionMiddleware` implementado, registrado e testado.
- [ ] Página React `client/welcome.tsx` responsiva e estilizada.
- [ ] Testes funcionais cobrindo:
  - Emissão de cookie no join.
  - Bloqueio se comanda fechada.
  - Redirecionamento automático se sessão ativa.
- [ ] `npm run typecheck` sem erros.
