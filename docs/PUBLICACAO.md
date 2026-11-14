# Publicação controlada
O PR #1 permanece em rascunho. Não habilitar Pages, executar o workflow, alterar a visibilidade do repositório, abrir votação ou liberar acesso anônimo sem aprovação explícita.
## Pré-requisitos
- Revisão independente do catálogo, acessibilidade, responsividade e proteção dos dados.
- Confirmar limpeza dos votos fictícios e votacao_aberta FALSE.
- Revisar as permissões da implantação Apps Script; a URL privada não permite votação por visitantes públicos.
- Aprovar separadamente a exposição do catálogo e do serviço de avaliações.
## Após aprovação
1. Revisar e aprovar o PR, retirar do rascunho e realizar merge autorizado em main.
2. Em Settings > Pages, selecionar GitHub Actions como fonte (se o plano e a visibilidade permitirem).
3. Em Settings > Secrets and variables > Actions > Variables, definir VITE_APPS_SCRIPT_URL apenas se a URL tiver sido aprovada para exposição no bundle público. Não é segredo: variáveis VITE_ são públicas. Sem ela, o catálogo opera sem links de avaliação e ranking.
4. Em Actions, selecionar Publicar GitHub Pages (manual), branch main, digitar PUBLICAR e executar. Configurar revisão do ambiente github-pages, se disponível.
5. Verificar o endereço atribuído pelo GitHub, navegação e acesso. A base Vite é /Chagptt-x-GIthub/. Não abrir votação automaticamente.
## Reversão
Desabilitar Pages se necessário, fechar votação, preservar planilha privada e revisar a implantação. Merge e publicação são decisões distintas.
