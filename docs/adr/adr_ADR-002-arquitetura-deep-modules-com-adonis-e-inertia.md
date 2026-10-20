# ADR-002: Arquitetura Deep Modules Integrada com AdonisJS e Inertia.js

## Contexto

O projeto precisa ser construído com alta cobertura de testes automatizados guiados por IA sob a metodologia TDD/SDD. Projetos desenvolvidos com IA tendem a degradar rapidamente em arquiteturas anêmicas (CRUDs espalhados em controllers com regras duplicadas) ou em sobrecargas de camadas (APIs REST com dezenas de DTOs, Serializers e Stores desacopladas no frontend).

Precisamos de uma estrutura que garanta alta profundidade de implementação (regras encapsuladas) com interfaces públicas mínimas, além de permitir testes de ponta a ponta sem duplicação de contratos de API.

## Decisão

1. Adotar o padrão **Deep Modules** para estruturar a lógica de negócio em 3 módulos principais: `CatalogModule`, `TabSessionModule` e `OrderEngineModule`.
2. Utilizar **Inertia.js** sobre o AdonisJS v6, tornando a aplicação um monólito moderno onde os controllers alimentam diretamente componentes React/Vue com tipagem ponta a ponta.
3. Centralizar os testes automatizados nas interfaces públicas dos serviços dos módulos e nos endpoints HTTP dos controllers (testes de comportamento externo / Black-box TDD).

## Alternativas Consideradas

- **Arquitetura SPA Desacoplada (Fastify API + React SPA separado):** Descartada por exigir criação de clientes HTTP (Axios/React Query), DTOs duplicados e complexidade redobrada de autenticação/CORS.
- **MVC Tradicional com Adonis Edge Templates:** Descartada pela baixa reatividade da interface para visualizações complexas como o Kanban da Cozinha (KDS) e manipulação do carrinho mobile.
- **Microsserviços / Arquitetura Orientada a Eventos:** Descartada sumariamente por violar a restrição de tempo de 27 horas.

## Consequências

| Aspecto                        | Impacto Positivo (+)                                                                                                                         | Impacto Negativo / Risco (-)                                                                                  | Mitigação                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Eficácia com Agentes de IA** | A IA trabalha com escopo delimitado por módulo (_specs_ claras), evitando que alterações no catálogo afetem a máquina de estados de pedidos. | Necessidade de rigor na escrita das especificações para a IA não vazar lógica de negócio para os controllers. | Regra estrita de code review: controllers apenas orquestram chamadas aos módulos profundos.                    |
| **Manutenibilidade & Testes**  | Alta cobertura em testes de integração e domínio; refatorações internas dos módulos não quebram os testes de interface pública.              | Acoplamento do frontend ao ciclo de requisição do Inertia.                                                    | O Inertia fornece excelente experiência de desenvolvimento com React mantendo o roteamento simples do backend. |
| **Produtividade**              | Eliminação completa do boilerplate de rotas REST, serialização JSON manual e sincronização de contratos de API.                              | Exige entendimento do ciclo de vida de props e recargas parciais do Inertia.                                  | Utilizar helpers nativos de partial reload (`only: [...]`) para atualizações em tempo real.                    |
