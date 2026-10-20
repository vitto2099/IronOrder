# Diretrizes de Git e Versionamento

Ao realizar qualquer operação de Git (commits, criação de branches, merges) neste projeto, siga estritamente as seguintes regras:

1. **Mensagens de Commit (Conventional Commits em Português)**:
   - Formato obrigatório: `<tipo>: <descrição em português>`
   - Tipos válidos: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`, `perf`.
   - Use letras minúsculas e verbo no presente (ex: `feat: adiciona autenticação por alias`, `fix: corrige cálculo do subtotal`).
   - Mantenha commits atômicos com escopo único.

2. **Padrão de Nomes de Branches**:
   - Formato: `<tipo>/<identificador-kebab-case>`
   - Exemplo: `feat/menu-interativo`, `fix/login-erro`, `chore/atualizacao-deps`.

3. **Verificação Pré-Commit**:
   - Antes de efetuar commit, execute a validação necessária (`npm run lint` ou `npm run typecheck`).
   - Nunca comite arquivos de ambiente (`.env`), senhas, chaves ou diretórios temporários (`tmp/`, `.cache/`).
