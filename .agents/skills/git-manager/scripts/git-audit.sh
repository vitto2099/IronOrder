#!/usr/bin/env bash
set -e

echo "=== Git Manager: Auditoria do Repositório ==="
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Branch atual: $BRANCH"

echo ""
echo "--- Status dos Arquivos ---"
git status --short

echo ""
echo "--- Verificação de Arquivos Sensíveis ---"
SENSITIVE_FILES=$(git status --porcelain | grep -E '\.env|\.pem|\.key|id_rsa|credentials' || true)
if [ -n "$SENSITIVE_FILES" ]; then
    echo "⚠️ ALERTA: Arquivos potencialmente sensíveis detectados:"
    echo "$SENSITIVE_FILES"
    echo "Não inclua estes arquivos no commit!"
else
    echo "✅ Nenhum arquivo sensível detectado em alterações pendentes."
fi

echo ""
echo "--- Últimos 3 Commits ---"
git log -n 3 --oneline

if [ "$1" == "--verify" ]; then
    echo ""
    echo "--- Executando Verificação de Tipos e Lint ---"
    npm run typecheck
    npm run lint
    echo "✅ Verificações de integridade passaram!"
fi
