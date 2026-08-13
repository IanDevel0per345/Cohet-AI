# Auditoria de produção — Cohet AI

**Data:** 13 de agosto de 2026
**Domínio auditado:** https://cohet-ai.vercel.app
**Commit de correção final:** `0fa6937`
**Deployment de validação:** `dpl_DWnedap8BEfKfjwTsYyGSeHaEbYK`

## Resumo executivo

A aplicação está carregando no domínio principal sem erro global visível. A correção da rota dinâmica de busca foi publicada e validada: `/search/test` agora redireciona para `/`, em vez de exibir a tela de erro 500 do Vercel. O composer também está no estado solicitado: inicialmente compacto e, ao ser expandido, mostra o seletor de modelo e o controle de esforço dentro do próprio input.

A auditoria ainda identificou duas diferenças importantes entre o estado atual e o requisito amplo de navegação: `/library` não é uma página independente e retorna 404, embora a Library exista como painel contextual dentro da aplicação autenticada; além disso, a aplicação ainda utiliza vários ícones Tabler/Lucide em componentes internos, portanto a substituição por Iconscout não é literalmente global em todo o código.

## Matriz de rotas públicas

| Área | URL testada | Resultado | Observação |
|---|---|---:|---|
| Homepage | `/` | **OK** | Carrega o cabeçalho, Feedback, menu, composer e modelos. |
| Search sem query | `/search` | **Seguro** | Redireciona para `/`, conforme a implementação esperada para ausência de `q`. |
| Search inválido | `/search/test` | **Corrigido** | Redireciona para `/`; não reproduziu mais o erro 500. |
| Search com query | `/search?q=...` | **Implementado** | Cria uma conversa e renderiza o Chat com o texto de consulta. Não foi submetida consulta real durante a auditoria. |
| Search dinâmico válido | `/search/[id]` | **Blindado** | IDs curtos/inválidos são descartados antes do acesso ao banco; falhas de sessão e carregamento são tratadas com redirecionamento seguro. |
| Calendar | `/calendar` | **OK** | Exibe agosto de 2026, Today, navegação mensal, eventos e campo de inclusão. O evento local persistido apareceu na tela. |
| Library | `/library` | **Lacuna** | Retorna 404. A Library atual é um painel contextual aberto pelo Header/sidebar quando há sessão autenticada, não uma rota independente. |
| Login | `/auth/login` | **OK** | Google, e-mail, senha, recuperação, cadastro e retorno à home visíveis. Nenhuma credencial foi submetida. |
| Cadastro | `/auth/sign-up` | **OK** | E-mail, senha, confirmação, cadastro, login e retorno à home visíveis. Nenhuma conta foi criada. |
| Recuperação | `/auth/forgot-password` | **OK** | Campo de e-mail e ação de envio carregam corretamente. Nenhum e-mail foi enviado. |

## Composer e preferência revertida

Na homepage, o composer compacto mostra `Ask anything...` e o botão de voz. Após a expansão, foram observados `GPT 5.5`, o seletor de modelo e `Medium` dentro do próprio composer. Isso confirma a reversão solicitada: o seletor não está em um card separado no cabeçalho.

Os modelos exibidos no estado expandido incluem GPT 5.5, Opus 4.8, Gemini 3.5 Flash, Composer 2.5 e GLM 5.2. Não foi executado envio de mensagem ou troca persistida de modelo durante a auditoria.

## Sidebar, Header e responsividade

A sidebar autenticada contém New, Search, Calendar e Library. Search aponta para `/search`, Calendar para `/calendar`, New usa o fluxo de nova conversa e Library abre o contexto local da biblioteca. Na visualização não autenticada, a sidebar autenticada não é montada; o botão `Open menu` disponível no Header abre o menu de visitante com Sign In, Theme e Links.

A homepage visualizada em viewport de desktop não apresentou sobreposição entre Feedback e o trigger do menu. A correção de espaçamento responsivo do Header permanece no código. Não foi possível simular uma sessão autenticada real nem redimensionar o viewport do navegador de auditoria para uma validação pixel-perfect de todos os breakpoints; recomenda-se uma checagem manual final em largura móvel logada.

## Ícones e fontes

Os ícones oficiais Iconscout estão visíveis no Header, nos controles principais e na navegação autenticada por meio do componente compartilhado `IconScoutIcon`, com filtro de contraste para o tema escuro. A implementação, porém, ainda contém usos de `@tabler/icons-react` e `lucide-react` em diversos componentes internos, incluindo ações de mensagem, upload, feedback, menus e controles de pesquisa. Portanto, a afirmação correta é que os ícones globais prioritários foram migrados para Iconscout; a exigência de substituir **todos** os ícones do site ainda não está integralmente satisfeita.

A fonte principal da aplicação é local (`app/fonts/inter.woff2`). Não foram encontradas referências de `next/font/google` ou `fonts.googleapis.com` no código-fonte da aplicação.

## Estabilidade e deployment

O build local passou por ESLint e TypeScript antes do commit `0fa6937`. O deployment de produção foi criado com target `production`, atingiu estado READY e o domínio principal passou a redirecionar `/search/test` para a home. A blindagem foi aplicada em `app/search/[id]/page.tsx`: IDs inválidos são rejeitados cedo, a leitura de sessão é protegida e o carregamento do chat possui tratamento de exceção.

## Conclusão

O estado público atual é **estável para as rotas principais auditadas**, e o problema crítico do erro 500 em Search foi resolvido no domínio principal. O composer está conforme a preferência revertida. As pendências não bloqueantes são a ausência de uma rota independente para `/library`, a validação autenticada/mobile em uma sessão real e a migração completa dos ícones internos restantes para os assets oficiais Iconscout.

## Referências

[1]: https://cohet-ai.vercel.app "Cohet AI — domínio de produção"
[2]: https://cohet-ai.vercel.app/calendar "Cohet AI — Calendar"
[3]: https://cohet-ai.vercel.app/auth/login "Cohet AI — Login"
[4]: https://cohet-ai.vercel.app/auth/sign-up "Cohet AI — Cadastro"
[5]: https://cohet-ai.vercel.app/auth/forgot-password "Cohet AI — Recuperação de senha"
[6]: https://github.com/IanDevel0per345/Cohet-AI "Repositório Cohet AI"
