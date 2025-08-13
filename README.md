# 🤖 Automação de Tarefas com Scripts de Console

Este repositório contém uma coleção de scripts JavaScript projetados para serem executados no console do navegador, automatizando tarefas repetitivas em sistemas web específicos. Cada script foi desenvolvido para um fluxo de trabalho particular, lendo dados de planilhas e interagindo com formulários e listas de forma inteligente.

## ⚠️ Aviso

> Em caso de dúvidas ou personalizações, entre em contato com o desenvolvedor; Cauã de Souza Vieira - INNOVA


## 🗂️ Scripts Disponíveis

1.  [**CLUN (Classificação Única)**](#-clun-classificação-única)
2.  [**AGRUN (Alteração de Grupo Responsável Único)**](#-agrun-alteração-de-grupo-responsável-único)
3.  [**CLPP (Classificação por Planilha)**](#-clpp-classificação-por-planilha)
4.  [**ESFORM (Edição Sequencial de Formulário)**](#-esform-edição-sequencial-de-formulário)

## 🚀 Como Usar

A utilização de todos os scripts segue um processo semelhante:

1.  **Navegue** até a página web onde a tarefa será executada.
2.  Abra o **Console do Desenvolvedor** no seu navegador.
3.  **Copie** o código completo do script desejado (do arquivo `.js` correspondente).
4.  **Cole** o código no console.
5.  **Pressione Enter** para iniciar a execução.
6.  Siga as instruções que aparecerem no navegador (como colar o link de uma planilha ou preencher as variáveis de configuração).

---

### 📦 CLUN (Classificação Única)

-   **Projeto Arquivado:** Este foi o primeiro script desenvolvido.
-   **Função:** Automatiza a classificação de Ordens de Serviço (O.S.) que ainda não possuem uma classificação. Ele foi projetado para aplicar uma **única classificação pré-definida** em todas as O.S. elegíveis.
-   **Uso:** Ideal para tarefas de classificação em massa onde o valor a ser inserido é sempre o mesmo.

### 🔧 AGRUN (Alteração de Grupo Responsável Único)

-   **Status:** Versão estável.
-   **Função:** Este script foi projetado para uma alteração em massa e **não seletiva**. Ele aplica um **conjunto único e pré-definido** de `Grupo`, `Atividade` e `Objeto` a **TODAS** as Ordens de Serviço encontradas na lista, independentemente do estado atual delas. Ele navegará por todas as páginas para garantir que nenhuma O.S. seja deixada para trás.
-   **Uso:** Ideal para padronizar um grande lote de O.S. recém-criadas ou que precisam ser direcionadas para a mesma equipe de tratamento de forma rápida.

**✅ Funcionalidades Principais:**
-   **Configuração Simplificada:** As três variáveis (`Grupo`, `Atividade`, `Objeto`) são definidas facilmente no topo do script.
-   **Ação em Massa:** Modifica cada O.S. encontrada sem necessidade de verificações complexas.
-   **Seleção Inteligente de Dropdowns:** Lida com a seleção em cascata de formulários complexos, esperando o carregamento de cada campo.
-   **Suporte a Paginação:** Navega automaticamente por todas as páginas da lista.
-   **Gerenciamento de Janelas:** Previne o recarregamento da página e gerencia pop-ups.

### 📊 CLPP (Classificação por Planilha)

-   **Status:** Versão estável.
-   **Função:** Uma evolução do CLUN, este script lê os dados de uma planilha Google Sheets (publicada como `` `.csv` ``) para classificar múltiplas O.S., cada uma com um valor diferente e específico.

**✅ Funcionalidades Principais:**
-   **Configuração Flexível:** Permite definir quais colunas da planilha contêm o ID da O.S. e a Classificação.
-   **Mapeamento de Apelidos:** Converte "apelidos" (ex: `"SLA"`) para os valores oficiais (ex: `"Corretiva"`).
-   **Lista de Permissões:** Processa apenas classificações que estão em uma lista segura.
-   **Verificação de Eficiência:** Pula automaticamente as O.S. que já estão com a classificação correta.
-   **Gerenciamento de Janelas e Paginação.**

**📋 Preparação da Planilha (Google Sheets):**
1.  Crie uma planilha com (no mínimo) uma coluna para o **ID da O.S.** e outra para a **Classificação**.
2.  Vá em `Arquivo` > `Compartilhar` > `Publicar na web`.
3.  Selecione a aba correta e mude o formato para **`Valores separados por vírgula (.csv)`**.
4.  Clique em `Publicar` e **copie o link gerado**.

### 📝 ESFORM (Edição Sequencial de Formulário)

-   **Status:** Versão estável.
-   **Função:** Projetado para um fluxo de trabalho complexo de preenchimento de formulários. Ele lê uma planilha que funciona como uma lista de tarefas, localiza campos específicos em uma página e executa ações de edição e/ou validação.

**✅ Funcionalidades Principais:**
-   **Lógica Condicional:** Executa diferentes sequências de ações com base no conteúdo de uma "coluna de pergunta" na planilha.
-   **Localização por Ordem:** Encontra os campos na página com base em um número de ordem.
-   **Interação Robusta:** Lida com a abertura e o fechamento de múltiplos formulários pop-up (modais).
-   **Gerenciamento de Janelas.**

**📋 Preparação da Planilha (Google Sheets):**
1.  A planilha deve conter colunas para **Ordem**, **Pergunta**, **Texto de Edição** e **Texto de Validação**.
2.  Siga o mesmo processo de `Publicar na web` como `` `.csv` `` para gerar o link.

## ⚠️ Aviso

> Estes scripts foram desenvolvidos para interagir com a estrutura HTML específica do sistema no momento de sua criação. Se o site sofrer atualizações visuais ou estruturais, os seletores de elementos no código podem precisar de ajustes. Utilize com atenção e sempre supervise a primeira execução.
