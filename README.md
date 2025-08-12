# 🤖 Automação de Tarefas com Scripts de Console

Este repositório contém uma coleção de scripts JavaScript projetados para serem executados no console do navegador, automatizando tarefas repetitivas em sistemas web específicos. Cada script foi desenvolvido para um fluxo de trabalho particular, lendo dados de planilhas e interagindo com formulários e listas de forma inteligente.

## 🗂️ Scripts Disponíveis

1.  **CLUN (Classificação Única)**
2.  **CLPP (Classificação por Planilha)**
3.  **ESFORM (Edição Sequencial de Formulário)**

## 🚀 Como Usar

A utilização de todos os scripts segue um processo semelhante:

1.  **Navegue** até a página web onde a tarefa será executada.
2.  Abra o **Console do Desenvolvedor** no seu navegador.
3.  **Copie** o código completo do script desejado (do arquivo `.js` correspondente).
4.  **Cole** o código no console.
5.  **Pressione Enter** para iniciar a execução.
6.  Siga as instruções que aparecerem no navegador (como colar o link de uma planilha).

-----

### 📦 CLUN (Classificação Única)

  - **Projeto Arquivado:** Este foi o primeiro script desenvolvido.
  - **Função:** Automatiza a classificação de Ordens de Serviço (O.S.) que ainda não possuem uma classificação. Ele foi projetado para aplicar uma **única classificação pré-definida** (ex: "Corretiva Planejada") em todas as O.S. elegíveis.
  - **Uso:** Ideal para tarefas de classificação em massa onde o valor a ser inserido é sempre o mesmo.

### 📊 CLPP (Classificação por Planilha)

  - **Status:** Versão estável e recomendada para classificação de O.S.
  - **Função:** Uma evolução do CLUN, este script lê os dados de uma planilha Google Sheets (publicada como `` `.csv` ``) para classificar múltiplas O.S., cada uma com um valor diferente.

**✅ Funcionalidades Principais:**

  - **Configuração Flexível:** Permite definir quais colunas da planilha contêm o ID da O.S. e a Classificação.
  - **Mapeamento de Apelidos:** Converte automaticamente "apelidos" (ex: `"SLA"`) para os valores oficiais do sistema (ex: `"Corretiva"`).
  - **Lista de Permissões:** Processa apenas classificações que estão em uma lista segura, ignorando ações indesejadas (como `"Cancelar OS"`).
  - **Verificação de Eficiência:** Pula automaticamente as O.S. que já estão com a classificação correta.
  - **Gerenciamento de Janelas:** Abre os resultados em janelas pop-up e as fecha automaticamente para economizar memória.
  - **Suporte a Paginação:** Navega automaticamente por todas as páginas da lista de O.S.

**📋 Preparação da Planilha (Google Sheets):**

1.  Crie uma planilha com (no mínimo) uma coluna para o **ID da O.S.** e outra para a **Classificação**.
2.  No menu, vá em `Arquivo` \> `Compartilhar` \> `Publicar na web`.
3.  Selecione a aba correta e mude o formato para **`Valores separados por vírgula (.csv)`**.
4.  Clique em `Publicar` e **copie o link gerado**. É este link que o script irá pedir.

### 📝 ESFORM (Edição Sequencial de Formulário)

  - **Status:** Versão estável.
  - **Função:** Projetado para um fluxo de trabalho mais complexo de preenchimento de formulários. Ele lê uma planilha que funciona como uma lista de tarefas, localiza campos específicos em uma página e executa ações de edição e/ou validação.

**✅ Funcionalidades Principais:**

  - **Lógica Condicional:** Executa diferentes sequências de ações com base no conteúdo de uma "coluna de pergunta" na planilha (ex: edita um "Título" ou edita e valida um "Qr-code").
  - **Localização por Ordem:** Encontra os campos na página com base em um número de ordem, garantindo que a edição seja feita no local correto.
  - **Interação Robusta:** Lida com a abertura e o fechamento de múltiplos formulários pop-up (modais), preenchendo os campos corretos e clicando nos botões de "Cadastrar" ou "Atualizar".
  - **Gerenciamento de Janelas:** Assim como o CLPP, gerencia janelas pop-up para evitar a perda de performance do navegador.

**📋 Preparação da Planilha (Google Sheets):**

1.  A planilha deve conter colunas para **Ordem**, **Pergunta** (o gatilho da ação), **Texto de Edição** e **Texto de Validação**.
2.  Siga o mesmo processo de `Publicar na web` como `` `.csv` `` para gerar o link que será usado pelo script.

## ⚠️ Aviso

> Estes scripts foram desenvolvidos para interagir com a estrutura HTML específica do sistema no momento de sua criação. Se o site sofrer atualizações visuais ou estruturais, os seletores de elementos no código podem precisar de ajustes. Utilize com atenção e sempre supervisione a primeira execução.
