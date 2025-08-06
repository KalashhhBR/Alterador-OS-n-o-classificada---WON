/**
 * ========================================================================================
 * == SCRIPT DE AUTOMAÇÃO (VERSÃO FINAL - TOTALMENTE DOCUMENTADO) ==
 * ========================================================================================
 */

// Usamos uma IIFE (Immediately Invoked Function Expression) para encapsular todo o nosso código.
// Isso cria um escopo privado, evitando que nossas variáveis e funções entrem em conflito
// com as do site onde o script está rodando.
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

    // ====================================================================================
    // == Bloco 1: GERENCIAMENTO DE JANELAS
    // ====================================================================================
    // Este conjunto de funções é responsável por todo o ciclo de vida das janelas
    // pop-up abertas pelo script. Ele as rastreia, fornece um controle manual para o
    // usuário e as fecha para gerenciar o uso de memória do sistema.
    // ------------------------------------------------------------------------------------

    /**
     * @type {Window[]}
     * Array que serve como a "memória" de todas as janelas pop-up abertas.
     * Cada vez que `window.open()` é chamado, a referência da nova janela é guardada aqui.
     */
    const janelasAbertasPeloScript = [];

    /**
     * Itera sobre o array de janelas e fecha cada uma que ainda estiver aberta.
     * É a função central para a limpeza manual e automática.
     */
    function fecharTodasAsJanelas() {
        console.log(`%cFechando ${janelasAbertasPeloScript.length} janelas...`, 'color: #e67e22; font-weight: bold;');
        let fechadas = 0;
        janelasAbertasPeloScript.forEach(janela => {
            if (janela && !janela.closed) { // Verifica se a janela existe e não foi fechada.
                janela.close();
                fechadas++;
            }
        });
        console.log(`%c${fechadas} janelas foram fechadas.`, 'color: #e67e22;');
        janelasAbertasPeloScript.length = 0; // Esvazia o array.
        atualizarContadorDoBotao(); // Atualiza a interface do botão.
    }

    /**
     * Cria e adiciona um botão flutuante na página. Este botão dá ao usuário
     * um controle manual para invocar `fecharTodasAsJanelas` a qualquer momento.
     */
    function criarBotaoDeFechamento() {
        const botao = document.createElement('button');
        botao.id = 'botao-fechar-janelas';
        botao.innerHTML = '❌ Fechar Janelas Abertas (0)';
        Object.assign(botao.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000', padding: '12px 20px',
            backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px',
            cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        });
        botao.onclick = fecharTodasAsJanelas;
        document.body.appendChild(botao);
    }

    /**
     * Atualiza o texto do botão para mostrar em tempo real quantas janelas estão abertas.
     */
    function atualizarContadorDoBotao() {
        const botao = document.getElementById('botao-fechar-janelas');
        if (botao) {
            const janelasRealmenteAbertas = janelasAbertasPeloScript.filter(j => j && !j.closed).length;
            botao.innerHTML = `❌ Fechar Janelas Abertas (${janelasRealmenteAbertas})`;
        }
    }

    // ====================================================================================
    // == Bloco 2: FUNÇÃO AUXILIAR ASSÍNCRONA
    // ====================================================================================
    // Ferramenta de propósito geral para lidar com a natureza dinâmica da web.
    // ------------------------------------------------------------------------------------

    /**
     * Pausa a execução do script até que um elemento específico apareça no DOM.
     * Essencial para evitar erros ao tentar interagir com elementos que ainda não carregaram.
     * @param {string} selector - O seletor CSS do elemento que estamos esperando.
     * @returns {Promise<Element>} Uma promessa que, quando resolvida, retorna o elemento encontrado.
     */
    async function waitForElement(selector, context = document, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const element = context.querySelector(selector);
                if (element) { clearInterval(interval); resolve(element); }
                else if (Date.now() - startTime > timeout) { clearInterval(interval); reject(new Error(`Tempo esgotado: ${selector}`)); }
            }, 500);
        });
    }

    // ====================================================================================
    // == Bloco 3: ORQUESTRADOR PRINCIPAL
    // ====================================================================================
    // Esta é a função mestre que executa todo o fluxo de trabalho de forma sequencial.
    // ------------------------------------------------------------------------------------
    
    /**
     * A função principal que executa a automação do início ao fim.
     */
    async function processarTodasAsOrdens() {
        // --- ETAPA 1: Coleta e Processamento de Dados da Planilha ---
        const urlPlanilha = prompt("Por favor, cole aqui o link '.csv' da sua planilha publicada na web:");
        if (!urlPlanilha || !urlPlanilha.includes('csv')) {
            alert("Link inválido ou operação cancelada. O script não será executado.");
            return;
        }
        let DADOS_DA_PLANILHA = {};
        try {
            console.log("Baixando dados da planilha...");
            const response = await fetch(urlPlanilha); // Requisição de rede para a URL.
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
            const csvText = await response.text(); // Conteúdo do arquivo como texto.
            console.log("Processando dados CSV...");
            const linhas = csvText.trim().split('\n');
            for (const linha of linhas.slice(1)) { // Pula a primeira linha (cabeçalho).
                const colunas = linha.split(',');
                if (colunas.length >= 2) {
                    const idOS = colunas[0].trim().replace(/"/g, '');
                    const classificacao = colunas[1].trim().replace(/"/g, '');
                    if (idOS && classificacao) DADOS_DA_PLANILHA[idOS] = classificacao;
                }
            }
            if (Object.keys(DADOS_DA_PLANILHA).length === 0) throw new Error("Nenhum dado válido foi processado.");
            console.log(`%cSucesso! ${Object.keys(DADOS_DA_PLANILHA).length} mapeamentos de OS carregados.`, 'color: lightgreen;');
        } catch (error) {
            alert("Falha ao baixar ou processar os dados da planilha.");
            console.error("Erro ao obter dados da planilha:", error);
            return;
        }

        // --- ETAPA 2: Inicialização e Verificações de Ambiente ---
        console.log("🚀 INICIANDO AUTOMAÇÃO COM DADOS AO VIVO 🚀");
        criarBotaoDeFechamento();
        if (typeof $ === 'undefined' || typeof $.fn.modal === 'undefined') {
            console.error("ERRO CRÍTICO: jQuery ou Bootstrap Modal não encontrados.");
            return;
        }
        const osProcessadasNestaSessao = new Set();

        // --- ETAPA 3: Loop Principal de Processamento ---
        while (true) {
            // 3.1: Encontrar a Próxima O.S. Válida
            // A planilha é a "lista de tarefas". O script busca na página um elemento
            // cujo ID esteja na planilha e que ainda não tenha sido processado.
            const ordemParaProcessar = Array.from(document.querySelectorAll('#solicitacoesPendentes .list-group-item.media')).find(ordem => {
                const idInput = ordem.querySelector('input.selecionado[id]');
                if (!idInput) return false;
                const idDaOS = idInput.id;
                return DADOS_DA_PLANILHA.hasOwnProperty(idDaOS) && !osProcessadasNestaSessao.has(idDaOS);
            });

            // Se não houver mais O.S. na página que correspondam à nossa lista de tarefas, encerra.
            if (!ordemParaProcessar) {
                console.log("%c🎉 Trabalho concluído! Limpando janelas finais...", "color: green; font-size: 16px; font-weight: bold;");
                fecharTodasAsJanelas();
                break;
            }

            const idDaOS = ordemParaProcessar.querySelector('input.selecionado[id]').id;
            const classificacaoEscolhida = DADOS_DA_PLANILHA[idDaOS];
            
            // 3.2: Verificação de Retrabalho (Eficiência)
            // Se a O.S. já está com a classificação correta, pula para a próxima.
            if (ordemParaProcessar.innerText.toLowerCase().includes(classificacaoEscolhida.toLowerCase())) {
                console.warn(`%c[JÁ CORRETO] O.S. ID: ${idDaOS} já está classificada como "${classificacaoEscolhida}". Pulando...`, 'color: #3498db;');
                osProcessadasNestaSessao.add(idDaOS);
                await new Promise(resolve => setTimeout(resolve, 50));
                continue;
            }
            
            console.log(`%c[PROCESSANDO] O.S. ID: ${idDaOS} -> Classificação da planilha: "${classificacaoEscolhida}"`, "color: orange; font-weight: bold;");

            // 3.3: Bloco de Ação Principal (try...catch para tratamento de erros)
            try {
                // 3.3.1: Abertura do Formulário e da Nova Janela
                ordemParaProcessar.querySelector('a[data-toggle="dropdown"]').click();
                await new Promise(resolve => setTimeout(resolve, 200));
                ordemParaProcessar.querySelector(`a[id="aceitar|${idDaOS}"]`).click();

                const form = await waitForElement('form[action*="aceitarSolicitacao"]');
                const windowName = 'os_submission_' + idDaOS;
                const windowFeatures = 'width=800,height=600,scrollbars=yes,resizable=yes';
                const novaJanela = window.open('', windowName, windowFeatures);
                if (novaJanela) novaJanela.blur();
                janelasAbertasPeloScript.push(novaJanela);
                atualizarContadorDoBotao();
                form.target = windowName;

                // 3.3.2: Preenchimento do Formulário (Lógica Case-Insensitive)
                const select = await waitForElement("select[name^='preenchimentoPadrao_']", form);
                const todasAsOpcoes = Array.from(select.options);
                const opcaoCorreta = todasAsOpcoes.find(opt => opt.textContent.toLowerCase() === classificacaoEscolhida.toLowerCase());

                if (opcaoCorreta) {
                    select.value = opcaoCorreta.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`   - Classificação preenchida: "${opcaoCorreta.textContent}"`);
                } else {
                    console.error(`   - ERRO: A classificação "${classificacaoEscolhida}" não foi encontrada nas opções do formulário.`);
                    $('.modal.in').modal('hide');
                    osProcessadasNestaSessao.add(idDaOS);
                    continue;
                }

                // 3.3.3: Salvamento e Fechamento do Modal
                const btnSalvar = Array.from(form.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Salvar');
                btnSalvar.onclick = () => true; // Pula confirmação.
                btnSalvar.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                $('.modal.in').modal('hide'); // Fecha o modal.

                // 3.3.4: Limpeza e Pausa Pós-Ação
                osProcessadasNestaSessao.add(idDaOS);
                console.log(`   - O.S. ${idDaOS} adicionada à memória da sessão.`);
                console.log('   - Aguardando 2.5 segundos para estabilização...');
                await new Promise(resolve => setTimeout(resolve, 2500));

                // 3.3.5: Gerenciamento Automático de Janelas
                if (janelasAbertasPeloScript.length >= 5) {
                    fecharTodasAsJanelas();
                    console.log('   - Pausa adicional de 2 segundos após a limpeza das janelas.');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

            } catch (error) {
                console.error(`ERRO no processamento da OS ${idDaOS}:`, error);
                console.log("A automação será interrompida. Fechando todas as janelas...");
                fecharTodasAsJanelas();
                break;
            }

            console.log(`%c[SUCESSO] OS ${idDaOS} processada. Procurando a próxima...`, "color: lightblue;");
        }
    }

    // Ponto de entrada: chama a função principal para iniciar todo o processo.
    processarTodasAsCadens();
})();
