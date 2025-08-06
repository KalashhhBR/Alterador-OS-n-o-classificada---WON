/**
 * ========================================================================================
 * == SCRIPT DE AUTOMAÇÃO - Classificação Unica ==
 * ========================================================================================
 *
 * Script de automação baseado em classificação única.
 * 
 */

// Usamos uma IIFE (Immediately Invoked Function Expression) para encapsular todo o nosso código.
// Isso cria um escopo privado e evita que nossas variáveis e funções entrem em conflito
// com as variáveis e funções do site onde o script está rodando.
(function() {
    /**
     * Verificação de segurança para impedir que o script seja injetado e executado
     * múltiplas vezes na mesma página. Se o botão de controle já existe,
     * ele assume que o script já está em execução e para.
     */
    if (document.getElementById('botao-fechar-janelas')) {
        console.log("O script de automação já foi injetado nesta página.");
        return;
    }

    // --- SEÇÃO DE GERENCIAMENTO DE JANELAS ---

    /**
     * @type {Window[]}
     * Array global (dentro do escopo do nosso script) que armazena as referências (handles)
     * de todas as janelas pop-up abertas. É a "memória" de quais janelas precisam ser gerenciadas.
     */
    const janelasAbertasPeloScript = [];

    /**
     * Itera sobre o array `janelasAbertasPeloScript` e fecha cada janela que ainda
     * estiver aberta. Ao final, limpa o array para recomeçar a contagem.
     * Esta função é o núcleo do gerenciamento de memória do script.
     */
    function fecharTodasAsJanelas() {
        console.log(`%cFechando ${janelasAbertasPeloScript.length} janelas...`, 'color: #e67e22; font-weight: bold;');
        let fechadas = 0;
        janelasAbertasPeloScript.forEach(janela => {
            // Verifica se a referência da janela é válida e se a janela não foi fechada manualmente.
            if (janela && !janela.closed) {
                janela.close();
                fechadas++;
            }
        });
        console.log(`%c${fechadas} janelas foram fechadas.`, 'color: #e67e22;');
        // Esvazia o array para a próxima rodada de aberturas.
        janelasAbertasPeloScript.length = 0;
        atualizarContadorDoBotao(); // Garante que o contador no botão volte a zero.
    }

    /**
     * Cria e injeta um botão flutuante na página. Este botão serve como um controle
     * manual de emergência para o usuário fechar todas as janelas pop-up
     * a qualquer momento.
     */
    function criarBotaoDeFechamento() {
        const botao = document.createElement('button');
        botao.id = 'botao-fechar-janelas';
        botao.innerHTML = '❌ Fechar Janelas Abertas (0)';
        // Aplica um conjunto de estilos para tornar o botão visível e acessível.
        Object.assign(botao.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000',
            padding: '12px 20px', backgroundColor: '#dc3545', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '16px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        });
        // Associa a função de fechamento ao evento de clique do botão.
        botao.onclick = fecharTodasAsJanelas;
        document.body.appendChild(botao);
    }

    /**
     * Atualiza o texto do botão flutuante para mostrar quantas janelas
     * estão atualmente abertas, fornecendo feedback visual em tempo real ao usuário.
     */
    function atualizarContadorDoBotao() {
        const botao = document.getElementById('botao-fechar-janelas');
        if (botao) {
            // Filtra o array para ter certeza que estamos contando apenas janelas que o navegador confirma que ainda estão abertas.
            const janelasRealmenteAbertas = janelasAbertasPeloScript.filter(j => j && !j.closed).length;
            botao.innerHTML = `❌ Fechar Janelas Abertas (${janelasRealmenteAbertas})`;
        }
    }

    /**
     * Função assíncrona para pausar a execução do script até que um elemento específico
     * apareça na página. Essencial para lidar com conteúdo que carrega dinamicamente (AJAX).
     * @param {string} selector - O seletor CSS do elemento esperado.
     * @param {Document|Element} context - Onde procurar pelo elemento (padrão: todo o documento).
     * @param {number} timeout - Tempo máximo de espera em milissegundos.
     * @returns {Promise<Element>} Uma promessa que resolve com o elemento encontrado.
     */
    async function waitForElement(selector, context = document, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const element = context.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    reject(new Error(`Tempo esgotado esperando por: ${selector}`));
                }
            }, 500);
        });
    }

    /**
     * Função principal que orquestra todo o fluxo de automação.
     */
    async function processarTodasAsOrdens() {
        // --- Bloco de Interação com o Usuário ---
        // Define as opções de classificação que serão apresentadas.
        const opcoesDeClassificacao = {
            '1': 'Corretiva Planejada', '2': 'Corretiva', '3': 'Melhoria',
            '4': 'Acompanhamento', '5': 'Atendimento'
        };
        // Constrói o texto que será exibido na caixa de diálogo.
        let textoPrompt = "Por favor, escolha a classificação de O.S. a ser aplicada:\n\n";
        for (const key in opcoesDeClassificacao) {
            textoPrompt += `${key} - ${opcoesDeClassificacao[key]}\n`;
        }
        textoPrompt += "\nDigite o número da opção desejada:";
        // Exibe o prompt e armazena a resposta do usuário.
        const escolhaUsuario = prompt(textoPrompt);

        // --- Bloco de Validação da Entrada do Usuário ---
        if (escolhaUsuario === null) { // Se o usuário clicou em "Cancelar".
            console.log("❌ Operação cancelada pelo usuário.");
            return;
        }
        // Converte o número digitado (ex: '1') para o texto correspondente (ex: 'Corretiva Planejada').
        const classificacaoEscolhida = opcoesDeClassificacao[escolhaUsuario.trim()];
        if (!classificacaoEscolhida) { // Se a entrada não corresponde a nenhuma opção válida.
            alert(`Opção inválida: "${escolhaUsuario}". O script não será executado.`);
            console.error(`❌ Opção inválida: "${escolhaUsuario}".`);
            return;
        }

        console.log(`🚀 INICIANDO AUTOMAÇÃO COM A CLASSIFICAÇÃO: "${classificacaoEscolhida}" 🚀`);
        criarBotaoDeFechamento();

        // Verificação de segurança para garantir que a página possui as bibliotecas necessárias.
        if (typeof $ === 'undefined' || typeof $.fn.modal === 'undefined') {
            console.error("ERRO CRÍTICO: jQuery ou Bootstrap Modal não encontrados.");
            return;
        }

        // Cria um "Set" para guardar os IDs das O.S. já processadas e evitar retrabalho.
        const osProcessadasNestaSessao = new Set();

        // Loop principal: continuará rodando enquanto houver O.S. para processar.
        while (true) {
            // Encontra a primeira O.S. que satisfaz duas condições:
            // 1. Não contém o texto "Classificação de O.S.".
            // 2. Seu ID ainda não foi adicionado à nossa memória de sessão.
            const ordemParaProcessar = Array.from(document.querySelectorAll('#solicitacoesPendentes .list-group-item.media')).find(ordem => {
                const idInput = ordem.querySelector('input.selecionado[id]');
                if (!idInput) return false;
                const idDaOS = idInput.id;
                return !ordem.innerText.includes("Classificação de O.S.") && !osProcessadasNestaSessao.has(idDaOS);
            });

            // Se nenhuma O.S. for encontrada, o trabalho terminou.
            if (!ordemParaProcessar) {
                console.log("%c🎉 Trabalho concluído! Limpando janelas finais...", "color: green; font-size: 16px; font-weight: bold;");
                fecharTodasAsJanelas();
                break; // Encerra o loop 'while'.
            }

            const idDaOS = ordemParaProcessar.querySelector('input.selecionado[id]').id;
            console.log(`%c[PROCESSANDO] O.S. ID: ${idDaOS}`, "color: orange; font-weight: bold;");

            // O bloco try...catch garante que, se ocorrer um erro em uma O.S., o script para de forma segura.
            try {
                // Simula os cliques para abrir o formulário modal.
                ordemParaProcessar.querySelector('a[data-toggle="dropdown"]').click();
                await new Promise(resolve => setTimeout(resolve, 200));
                ordemParaProcessar.querySelector(`a[id="aceitar|${idDaOS}"]`).click();

                // Espera pelo formulário carregar e o manipula.
                const form = await waitForElement('form[action*="aceitarSolicitacao"]');
                const windowName = 'os_submission_' + idDaOS;
                const windowFeatures = 'width=800,height=600,scrollbars=yes,resizable=yes';
                const novaJanela = window.open('', windowName, windowFeatures);
                if (novaJanela) novaJanela.blur(); // Truque para abrir a janela sem roubar o foco.
                janelasAbertasPeloScript.push(novaJanela);
                atualizarContadorDoBotao();
                form.target = windowName; // Direciona o resultado do form para a nova janela.

                const select = await waitForElement("select[name^='preenchimentoPadrao_']", form);
                select.value = classificacaoEscolhida; // Usa a classificação escolhida pelo usuário.
                select.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`   - Classificação selecionada: "${classificacaoEscolhida}"`);

                const btnSalvar = Array.from(form.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Salvar');
                btnSalvar.onclick = () => true; // Pula a caixa de confirmação.
                btnSalvar.click();
                await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa para o envio ser processado.

                // Fecha o modal usando o método mais confiável (API do Bootstrap).
                $('.modal.in').modal('hide');

                osProcessadasNestaSessao.add(idDaOS);
                console.log(`   - O.S. ${idDaOS} adicionada à memória da sessão.`);
                console.log('   - Aguardando 2.5 segundos para estabilização...');
                await new Promise(resolve => setTimeout(resolve, 2500));

                // Verifica se o limite de janelas foi atingido para limpeza automática.
                if (janelasAbertasPeloScript.length >= 5) {
                    fecharTodasAsJanelas();
                    console.log('   - Pausa adicional de 2 segundos após a limpeza das janelas.');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

            } catch (error) {
                // Em caso de erro, interrompe o script e tenta fechar as janelas abertas.
                console.error(`ERRO no processamento da OS ${idDaOS}:`, error);
                console.log("A automação será interrompida por segurança. Fechando todas as janelas...");
                fecharTodasAsJanelas();
                break;
            }

            console.log(`%c[SUCESSO] OS ${idDaOS} processada. Procurando a próxima...`, "color: lightblue;");
        }
    }

    // Chama a função principal para iniciar todo o processo.
    processarTodasAsOrdens();

})();
