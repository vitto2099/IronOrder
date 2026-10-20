# ADR-001: Arquitetura Local-First com SQLite e Cloudflare Tunnel

## Contexto

O sistema precisa rodar dentro do ambiente físico de bares e restaurantes, com prazo restrito de desenvolvimento (27 horas distribuídas em 9 encontros acadêmicos). Os clientes realizam a leitura de QR Codes através de smartphones móveis conectados ao Wi-Fi local ou redes móveis (4G/5G).

Desafios identificados:

1. Navegadores mobile modernos exigem contexto seguro (**HTTPS**) para habilitar leitura facilitada e recursos modernos de PWA.
2. Configurar servidores DNS locais, certificados SSL autoassinados ou leases DHCP estáticos no roteador do estabelecimento gera alta fricção e dependência de hardware de rede especializado.
3. Bancos de dados tradicionais (PostgreSQL/MySQL em Docker) aumentam a sobrecarga de setup, portas abertas e consumo de memória em hardware modesto local.

## Decisão

Adotamos uma abordagem **Local-First** centrada em:

1. **SQLite Local** (`database.sqlite`) via Lucid ORM como motor de persistência padrão, eliminando serviços de banco externos.
2. **Cloudflare Tunnel (cloudflared)** para expor a porta local do AdonisJS através de um subdomínio seguro HTTPS com certificado gerenciado e sem necessidade de abrir portas no roteador (_port forwarding_).

## Alternativas Consideradas

- **Deploy 100% Cloud (VPS/PaaS):** Descartado pois descaracteriza a premissa de autonomia local do estabelecimento e dependeria criticamente de banda de upload contínua para sincronização básica de pedidos.
- **Rede Local Pura com IP/HTTP (`http://192.168.x.x`):** Descartado pelas falhas de segurança acusadas pelos navegadores mobile ao escanear o QR Code e impossibilidade de usar certas APIs de navegador.
- **PostgreSQL em Docker Compose local:** Descartado para o MVP/timebox de 27h por adicionar complexidade de orquestração desnecessária para a carga de trabalho de uma única loja física.

## Consequências

| Aspecto                              | Impacto Positivo (+)                                                                          | Impacto Negativo / Risco (-)                                                          | Mitigação                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Experiência do Usuário (Cliente)** | Acesso imediato via HTTPS seguro sem alertas de certificado inválido no celular.              | Dependência do túnel ativo para clientes em 4G/5G.                                    | Manter rota de fallback HTTP em rede local se configurado captive portal.                                  |
| **Infraestrutura & Setup**           | Zero dependência externa de containers de banco; backup trivial copiando o arquivo `.sqlite`. | SQLite possui limitações em cenários de escritas concorrentes massivas simultâneas.   | AdonisJS com WAL Mode (_Write-Ahead Logging_) ativado no SQLite suporta com folga o volume de 20-50 mesas. |
| **Velocidade de Desenvolvimento**    | Início imediato do TDD sem necessidade de scripts de orquestração de banco.                   | Necessidade de rodar o binário `cloudflared` em conjunto com o servidor da aplicação. | Criar script de inicialização única no `package.json` (`npm run dev:tunnel`).                              |
