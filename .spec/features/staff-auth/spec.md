# Spec: Staff auth

> feature: staff-auth
> status: pronta

## Contexto

Autenticação de colaboradores (staff), controle de acesso baseado em papéis fixos (RBAC - ADMIN, GERENTE, GARCOM, CAIXA, COZINHA) e proteção de rotas administrativas e operacionais.

## Histórias

### US-008 — Autenticação e Gestão de Colaboradores (RBAC)

Como administrador, quero cadastrar funcionários e definir seus papéis de acesso, para garantir que cada colaborador acesse apenas as funcionalidades referentes à sua função.

#### AC-019 — Suporte aos Papéis Fixos de Acesso

- **Dado** o sistema configurado com a estrutura de papéis (`ADMIN`, `GERENTE`, `GARCOM`, `CAIXA`, `COZINHA`)
- **Quando** um colaborador realiza login no sistema
- **Então** o perfil atribuído limita as telas e ações acessíveis (ex: Cozinha acessa apenas KDS; Garçom acessa Grid de Mesas e cancelamentos; Admin acessa tudo).

#### AC-020 — Cadastro de Colaboradores e Unicidade de E-mail

- **Dado** o Administrador cadastrando um novo colaborador no painel administrativo
- **Quando** insere Nome, E-mail, Senha Inicial e Papel
- **Então** o colaborador é salvo com senha hash segura; se o e-mail informado já estiver cadastrado no sistema, a requisição é recusada com erro de duplicidade.

### US-009 — Proteção de Rotas Administrativas e Operacionais

Como sistema, quero interceptar requisições para rotas restritas, para impedir que usuários operacionais sem permissão acessem dados administrativos ou configurações sensíveis.

#### AC-021 — Bloqueio de Acesso por Middleware (HTTP 403 Forbidden)

- **Dado** um usuário autenticado com perfil operacional (ex: `GARCOM` ou `COZINHA`)
- **Quando** tenta acessar diretamente uma rota exclusiva de gestão (ex: `/admin/users`, `/admin/catalog`, relatórios financeiros)
- **Então** o middleware `role_guard_middleware` nega o acesso e retorna status HTTP 403 (Forbidden) com mensagem de permissão insuficiente.

## Fora de escopo

- Login social (OAuth com Google/Apple) para funcionários.
- Redefinição de senha via envio de e-mail externo (recuperação é feita presencialmente pelo Admin).

## Suposições

| ID      | Suposição                                                                                                               | Status | Resolução |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| ASM-005 | A autenticação de funcionários utiliza o pacote oficial `@adonisjs/auth` com guard de sessão em cookies criptografados. | aberta | —         |

## Perguntas em aberto

| ID    | Pergunta                                                                                                         | Status     | Resposta |
| ----- | ---------------------------------------------------------------------------------------------------------------- | ---------- | -------- |
| Q-004 | Um usuário `ADMIN` padrão (seed inicial) deve ser gerado automaticamente na primeira migração do banco de dados? | respondida | Sim      |
