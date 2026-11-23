<a id="topo"></a>
<div align="center">

<h1>MCP Gateway Lab</h1>

<p>Do primeiro servidor MCP a um gateway em TypeScript inspirado na arquitetura da Uber.</p>
<p><strong>Projeto autoral de estudo · Em fase de desenvolvimento</strong></p>

<p>
<img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
<img alt="MCP SDK v2" src="https://img.shields.io/badge/MCP_SDK-v2-181717?style=for-the-badge">
<a href="LICENSE"><img alt="Licença MIT" src="https://img.shields.io/badge/Licen%C3%A7a-MIT-0F766E?style=for-the-badge"></a>
</p>

<p><a href="#comece-aqui">Comece aqui</a> · <a href="#arquitetura-atual">Arquitetura atual</a> · <a href="#trilha-de-implementacao">Trilha de implementação</a> · <a href="#sobre-mim">Sobre mim</a></p>
</div>

---

> [!NOTE]
> **Tutorial em breve.** Vou publicar um guia explicando as decisões de arquitetura, por que tomei cada uma delas e como implementar o laboratório passo a passo, do primeiro servidor MCP ao gateway em TypeScript.

## De onde vem a ideia

O time de engenharia da Uber descreveu como centralizou a descoberta, a governança e a execução de ferramentas MCP usadas por agentes. O **MCP Registry** organiza o catálogo e a habilitação de ferramentas no plano de controle. O **Proxy Gateway** encaminha as chamadas aos serviços de destino no plano de dados. [Uber Engineering · Designing MCP Gateway](https://www.uber.com/au/en/blog/designing-mcp-gateway/)

Este laboratório recria em pequena escala as ideias publicadas no artigo, com código autoral e um banco fictício como cenário. O objetivo é entender, etapa por etapa, como um gateway pode expor ferramentas a clientes MCP e atuar como cliente dos servidores de destino. O projeto é independente da Uber e roda localmente com dados fictícios, sem chaves de API ou acesso a serviços bancários.

## Comece aqui

Use **Node.js 24**, npm e Git. Na raiz do projeto, execute:

```sh
git clone https://github.com/glaucia86/mcp-gateway-typescript.git
cd mcp-gateway-typescript
npm ci
npm run dev
```

O último comando imprime o estado `bootstrap` no terminal e encerra. Se o PowerShell bloquear `npm.ps1`, use `npm.cmd` e `npx.cmd` no lugar de `npm` e `npx`.

### Experimente o servidor MCP

O MCP Inspector inicia o servidor como subprocesso e permite descobrir e chamar ferramentas sem um LLM. Para usar o Inspector com Node.js 24, instale a versão **24.22.1 ou superior**. [Documentação do MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)

```sh
npx --yes @modelcontextprotocol/inspector node --import tsx src/mcp/branches-stdio.ts
```

No navegador, conecte-se ao servidor, abra a aba **Tools** e experimente as chamadas abaixo.

| Ferramenta | Argumentos | Resultado esperado |
| --- | --- | --- |
| `list_branches` | `{}` | Três agências fictícias |
| `list_branches` | `{"city":"Rio de Janeiro"}` | Duas agências no Rio de Janeiro |
| `get_branch` | `{"id":"AG-002"}` | Agência Barra |
| `get_branch` | `{"id":"AG-999"}` | Erro de ferramenta, pois a agência não existe |
| `list_cities` | `{}` | Rio de Janeiro e São Paulo |

### Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Exibe o estado do bootstrap e encerra |
| `npm run mcp:branches` | Inicia o servidor de agências e aguarda um cliente via `stdio` |
| `npm run mcp:tickets` | Inicia o servidor de chamados via `stdio` |
| `npm run mcp:demo` | Consulta agências e chamados em dois servidores locais |
| `npm run registry:validate` | Valida `registry.json` e mostra a contagem de servidores e ferramentas |
| `npm run registry:fingerprints` | Descobre as ferramentas dos dois servidores e imprime seus fingerprints |
| `npm run registry:approve-live` | Exibe a definição de `branches:get_branch` e pede confirmação antes de registrar a aprovação |
| `npm run registry:verify-live` | Compara `branches:get_branch` com a aprovação registrada e retorna erro se estiver inelegível |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm test` | Executa os testes de domínio, Registry e integração MCP com Vitest |

## Arquitetura atual

```mermaid
flowchart LR
  Client["Cliente MCP / Inspector"] <-->|stdio| Servers["Servidores de agências e chamados"]
  Servers --> Domain["Catálogos fictícios em memória"]
  Commands["Comandos do Registry"] --> Client
  Commands --> Registry["registry.json"]
```

- `src/domain/` mantém as consultas aos catálogos em memória. [Agências](src/domain/branches.ts) · [Chamados](src/domain/tickets.ts)
- `src/mcp/` registra as ferramentas com Zod e reserva `stdout` para o protocolo `stdio`. [Servidores MCP](src/mcp)
- `src/client/` conecta os servidores locais e demonstra chamadas diretas. [Demonstração](src/client/demo.ts)
- `src/registry/` concentra o schema, a elegibilidade e a persistência. Os executáveis ficam em `src/registry/commands/`. [Registry](src/registry)

### Aprovação no Registry local

`registry:approve-live` mostra a definição e pede que você digite `APROVAR`. O responsável padrão é `team-branches`. Para seguir uma troca de responsável já registrada no arquivo, passe a equipe atual com `npm run registry:approve-live -- team-operations`. `approvedBy` registra a equipe declarada no CLI, e o fingerprint identifica a definição anunciada pelo servidor.

Revise as alterações em `registry.json` pelo Git. Se uma interrupção deixar `registry.json.lock`, remova esse arquivo somente após confirmar que nenhuma aprovação está em execução.

<a id="trilha-de-implementacao"></a>

## Trilha de implementação

| Etapa | O que o laboratório exercita | Estado |
| --- | --- | --- |
| 1 · Fundamentos e ambiente | Bootstrap, TypeScript e testes | Implementada |
| 2 · Primeiro servidor MCP | Catálogo de agências, ferramentas com Zod e transporte `stdio` | Implementada |
| 3 · Cliente e segundo servidor | Conectar uma aplicação TypeScript aos servidores de agências e de chamados fictícios, com um cliente MCP por servidor | Implementada |
| 4 · Registry | Cadastrar ferramentas, registrar aprovações e verificar a elegibilidade de definições | Implementada |
| 5 · Proxy Gateway | Encaminhar chamadas ao servidor certo e negar acesso por padrão | Planejada |
| 6 em diante · Descoberta e governança | Descoberta incremental inspirada no Omni MCP, auditoria, mascaramento de dados, limites de chamadas e aprovação humana para operações simuladas | Planejada |

O Inspector e a demonstração acessam diretamente os servidores locais. O proxy aplicará a política do Registry à listagem e à execução de ferramentas.

## Licença

Projeto de estudo de Glaucia Lemos, sob a [licença MIT](LICENSE).

---

<a id="sobre-mim"></a>

## 👩🏽‍💻 Sobre mim

<div align="center">
<a href="https://github.com/glaucia86"><img src="https://avatars.githubusercontent.com/u/1631477?v=4" width="170" height="170" alt="Foto de Glaucia Lemos"></a>

<h3>Glaucia Lemos</h3>
<p><strong>Software Engineer · Microsoft MVP · Codex &amp; Devin Ambassador</strong></p>
<p>Trabalho com engenharia de IA e arquitetura de software. Compartilho o que aprendo sobre TypeScript & Python MCP e aplicações com agentes em tutoriais, workshops e projetos de código aberto.</p>

<p>
<a href="https://www.youtube.com/user/l32759"><img alt="YouTube" src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&amp;logo=youtube&amp;logoColor=white"></a>
<a href="https://www.linkedin.com/in/glaucialemos/"><img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge"></a>
<a href="https://github.com/glaucia86"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&amp;logo=github&amp;logoColor=white"></a>
</p>
<p><a href="#topo">↑ Voltar ao topo</a></p>
</div>
