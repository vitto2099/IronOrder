# Spec: Tab session

> feature: tab-session
> status: pronta

## Contexto

Gestão do ciclo de vida da mesa, abertura de sessão de comanda via QR Code (Zero-Auth) com suporte a múltiplos Aliases por mesa e encerramento com liberação presencial.

## Histórias

### US-001 — Abertura de Mesa e Registro de Alias

Como cliente no restaurante, quero escanear o QR Code da mesa e informar meu apelido (Alias), para que eu possa iniciar o consumo e visualizar o cardápio sem necessidade de cadastro prévio.

#### AC-001 — Transição de Mesa LIVRE para OCUPADA e Criação de Comanda

- **Dado** uma mesa física com status `LIVRE` e sem comanda ativa
- **Quando** o cliente acessa a rota `/m/:tableId` via QR Code e envia seu Alias
- **Então** o status da mesa altera automaticamente para `OCUPADA`, uma nova `Comanda` ativa é criada e o cliente recebe um cookie HttpOnly de sessão válido por 12 horas.

#### AC-002 — Garantia de Unicidade de Alias na Mesma Mesa

- **Dado** uma comanda ativa na mesa que já possui o cliente registrado com o Alias "Bruno"
- **Quando** outro cliente tenta registrar o mesmo Alias "Bruno" na mesma comanda
- **Então** o sistema sugere ou anexa automaticamente um identificador numérico ao Alias, registrando o membro como "Bruno (2)".

#### AC-003 — Persistência da Sessão via Cookie de Cliente

- **Dado** um cliente que possui um cookie de sessão válido vinculado a uma comanda ativa
- **Quando** o cliente recarrega a página ou acessa o sistema novamente em até 12 horas
- **Então** o sistema reconhece a sessão do cliente e atribui suas ações ao seu Alias sem solicitar novo acesso.

### US-002 — Solicitação de Encerramento e Liberação de Mesa

Como cliente ou garçom, quero solicitar o encerramento da conta e liberar a mesa após a quitação presencial, para que a mesa fique disponível para novos clientes.

#### AC-004 — Transição de Mesa para CONTA_PEDIDA e Bloqueio de Pedidos

- **Dado** uma mesa no status `OCUPADA` com comanda ativa
- **Quando** o cliente clica na opção "Pedir Conta"
- **Então** a mesa transita para o status `CONTA_PEDIDA`, o envio de novos pedidos por clientes é bloqueado e um aviso visual é emitido no painel dos Garçons.

#### AC-005 — Liberação e Arquivamento da Comanda

- **Dado** uma mesa no status `CONTA_PEDIDA` e com pagamento presencial efetuado
- **Quando** o Garçom ou Caixa aciona a ação "Liberar Mesa" no PDV
- **Então** a comanda atual transita para o status `FECHADA`, os pedidos são arquivados para histórico, os cookies de clientes associados tornam-se inválidos e a mesa retorna ao status `LIVRE`.

## Fora de escopo

- Pagamento via gateway financeiro online (o pagamento é 100% presencial).
- Leitura dinâmica de QR Code impresso com token criptográfico mutável (QR Codes são estáticos por mesa no MVP).

## Suposições

| ID      | Suposição                                                                                                                 | Status | Resolução |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| ASM-001 | O tempo limite de 12 horas no cookie de cliente atende completamente à permanência máxima de uma refeição no salão.       | aberta | —         |
| ASM-002 | As URLs contidas nos QR Codes afixados nas mesas apontam diretamente para o subdomínio HTTPS seguro do Cloudflare Tunnel. | aberta | —         |

## Perguntas em aberto

| ID    | Pergunta                                                                                                                 | Status     | Resposta |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ---------- | -------- |
| Q-001 | Deve existir uma ação do garçom para reabrir uma mesa em status `CONTA_PEDIDA` caso o cliente desista de fechar a conta? | respondida | Sim      |
