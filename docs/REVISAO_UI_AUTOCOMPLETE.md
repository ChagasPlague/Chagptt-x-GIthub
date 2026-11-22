# Revisão de interface e busca assistida — V2.1
## Alterações
- O botão de filtros controla o atributo HTML `hidden`. A abertura/fechamento funciona em desktop e mobile sem depender de regras contraditórias de breakpoint. Contador de filtros ativos permanece visível quando recolhidos.
- Busca por texto livre preservada. Após duas letras, a aplicação sugere até cinco títulos do catálogo. Prefixos têm prioridade, seguidos pelo início de palavras e ocorrência interna. Não há conexão externa nem envio do termo ao servidor.
- Sugestão de preenchimento em cinza dentro do campo quando o texto corresponde ao início do título. Tab completa sem prender o foco; Enter completa e setas percorrem opções. Clique/toque seleciona o título. Esc fecha. Acessibilidade: combobox, listbox, opções identificadas e descrição de teclado.
- A comunicação do banner passa a indicar programação da edição de 2026, em vez de sugerir um evento futuro.
- CI passa a nomear claramente duas compilações intencionais (privada e pública).
## QA manual ainda necessária
1. Em 320, 375, 768 e 1280 px, clique em Filtros (+) e (−); teste com tema claro/escuro, teclado e toque.
2. Digite `Cons` e confirme a sugestão do projeto EXT-001; use Tab, Enter, setas, Esc e toque. Faça pesquisa sem sugestão e limpe o campo.
3. Confira rolagem do dropdown no celular, foco visível e ausência de scroll horizontal.
4. Verifique a build pública `VITE_CATALOG_ONLY=true` sem integração privada. Não implantar avaliações na página pública.
## Pendências da auditoria
Falta teste browser real automatizado (Playwright), verificação de sincronização das duas fontes de catálogo e homologação do backend privado com múltiplos usuários. Nenhum merge ou publicação nesta alteração.
