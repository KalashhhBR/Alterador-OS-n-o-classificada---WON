/**
 * ========================================================================================
 * == SCRIPT DE AUTOMAÇÃO POR PLANILHA (VERSÃO 2 - CONFIGURÁVEL) ==
 * ========================================================================================
 *
 */

(function() {
    // ====================================================================================
    // == Bloco de Configuração do Usuário
    // ====================================================================================
    // Modifique as 3 variáveis abaixo para personalizar o comportamento do script.
    // ------------------------------------------------------------------------------------

    /** (Config 1) Defina o número máximo de janelas que podem ser abertas antes da limpeza automática. */
    const MAXIMO_DE_JANELAS_ABERTAS = 5;

    /** (Config 2) Qual coluna da sua planilha contém o ID da Ordem de Serviço? (Use a letra) */
    const COLUNA_DO_ID_DA_OS = 'A';

    /** (Config 3) Qual coluna da sua planilha contém o texto da Classificação? (Use a letra) */
    const COLUNA_DA_CLASSIFICACAO = 'B';


    // ====================================================================================
    // == FIM DA CONFIGURAÇÃO - Não é necessário alterar mais nada abaixo.
    // ====================================================================================

    if (document.getElementById('botao-fechar-janelas')) {
        console.log("O script de automação já foi injetado.");
        return;
    }

    const janelasAbertasPeloScript = [];

    function fecharTodasAsJanelas() {
        console.log(`%cFechando ${janelasAbertasPeloScript.length} janelas...`, 'color: #e67e22; font-weight: bold;');
        let fechadas = 0;
        janelasAbertasPeloScript.forEach(janela => { if (janela && !janela.closed) { janela.close(); fechadas++; } });
        console.log(`%c${fechadas} janelas foram fechadas.`, 'color: #e67e22;');
        janelasAbertasPeloScript.length = 0;
        atualizarContadorDoBotao();
    }

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

    function atualizarContadorDoBotao() {
        const botao = document.getElementById('botao-fechar-janelas');
        if (botao) {
            const janelasRealmenteAbertas = janelasAbertasPeloScript.filter(j => j && !j.closed).length;
            botao.innerHTML = `❌ Fechar Janelas Abertas (${janelasRealmenteAbertas})`;
        }
    }
    
    /**
     * Converte uma letra de coluna (ex: 'A', 'B') para um índice de array (0, 1).
     * @param {string} letraColuna - A letra da coluna (case-insensitive).
     * @returns {number} O índice de array correspondente.
     */
    function letraParaIndice(letraColuna) {
        // Converte a letra para maiúscula e subtrai o código do caractere 'A' para obter um índice de base 0.
        return letraColuna.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
    }

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

    async function processarTodasAsOrdens() {
        const urlPlanilha = prompt("Por favor, cole aqui o link '.csv' da sua planilha publicada na web:");
        if (!urlPlanilha || !urlPlanilha.includes('csv')) {
            alert("Link inválido ou operação cancelada.");
            return;
        }

        // Converte as letras das colunas para os índices numéricos que o script usará.
        const indiceIdOS = letraParaIndice(COLUNA_DO_ID_DA_OS);
        const indiceClassificacao = letraParaIndice(COLUNA_DA_CLASSIFICACAO);

        // Validação para garantir que as colunas inseridas são letras válidas.
        if (isNaN(indiceIdOS) || isNaN(indiceClassificacao) || indiceIdOS < 0 || indiceClassificacao < 0) {
            alert("Configuração de colunas inválida! Por favor, use letras únicas como 'A', 'B', etc.");
            return;
        }

        let DADOS_DA_PLANILHA = {};
        try {
            console.log("Baixando dados da planilha...");
            const response = await fetch(urlPlanilha);
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
            const csvText = await response.text();
            
            console.log("Processando dados CSV...");
            const linhas = csvText.trim().split('\n');
            const indiceMaximo = Math.max(indiceIdOS, indiceClassificacao);

            for (const linha of linhas.slice(1)) {
                const colunas = linha.split(',');
                // Garante que a linha do CSV tenha colunas suficientes para os dados que queremos.
                if (colunas.length > indiceMaximo) {
                    const idOS = colunas[indiceIdOS].trim().replace(/"/g, '');
                    const classificacao = colunas[indiceClassificacao].trim().replace(/"/g, '');
                    if (idOS && classificacao) {
                        DADOS_DA_PLANILHA[idOS] = classificacao;
                    }
                }
            }
            if (Object.keys(DADOS_DA_PLANILHA).length === 0) throw new Error("Nenhum dado válido foi processado.");
            console.log(`%cSucesso! ${Object.keys(DADOS_DA_PLANILHA).length} mapeamentos de OS carregados.`, 'color: lightgreen;');
        } catch (error) {
            alert("Falha ao baixar ou processar os dados da planilha.");
            console.error("Erro ao obter dados da planilha:", error);
            return;
        }

        console.log("🚀 INICIANDO AUTOMAÇÃO COM DADOS AO VIVO 🚀");
        criarBotaoDeFechamento();

        if (typeof $ === 'undefined' || typeof $.fn.modal === 'undefined') {
            console.error("ERRO CRÍTICO: jQuery ou Bootstrap Modal não encontrados.");
            return;
        }

        const osProcessadasNestaSessao = new Set();
        while (true) {
            const ordemParaProcessar = Array.from(document.querySelectorAll('#solicitacoesPendentes .list-group-item.media')).find(ordem => {
                const idInput = ordem.querySelector('input.selecionado[id]');
                if (!idInput) return false;
                const idDaOS = idInput.id;
                return DADOS_DA_PLANILHA.hasOwnProperty(idDaOS) && !osProcessadasNestaSessao.has(idDaOS);
            });

            if (!ordemParaProcessar) {
                console.log("%c🎉 Trabalho concluído! Limpando janelas finais...", "color: green; font-size: 16px; font-weight: bold;");
                fecharTodasAsJanelas();
                break;
            }

            const idDaOS = ordemParaProcessar.querySelector('input.selecionado[id]').id;
            const classificacaoEscolhida = DADOS_DA_PLANILHA[idDaOS];
            
            if (ordemParaProcessar.innerText.toLowerCase().includes(classificacaoEscolhida.toLowerCase())) {
                console.warn(`%c[JÁ CORRETO] O.S. ID: ${idDaOS} já está classificada como "${classificacaoEscolhida}". Pulando...`, 'color: #3498db;');
                osProcessadasNestaSessao.add(idDaOS);
                await new Promise(resolve => setTimeout(resolve, 50));
                continue;
            }
            
            console.log(`%c[PROCESSANDO] O.S. ID: ${idDaOS} -> Classificação da planilha: "${classificacaoEscolhida}"`, "color: orange; font-weight: bold;");

            try {
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

                const select = await waitForElement("select[name^='preenchimentoPadrao_']", form);
                const todasAsOpcoes = Array.from(select.options);
                const opcaoCorreta = todasAsOpcoes.find(opt => opt.textContent.toLowerCase() === classificacaoEscolhida.toLowerCase());

                if (opcaoCorreta) {
                    select.value = opcaoCorreta.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`   - Classificação preenchida: "${opcaoCorreta.textContent}"`);
                } else {
                    console.error(`   - ERRO: A classificação "${classificacaoEscolhida}" da planilha não foi encontrada nas opções do formulário para a OS ${idDaOS}.`);
                    $('.modal.in').modal('hide');
                    osProcessadasNestaSessao.add(idDaOS);
                    continue;
                }

                const btnSalvar = Array.from(form.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Salvar');
                btnSalvar.onclick = () => true;
                btnSalvar.click();
                await new Promise(resolve => setTimeout(resolve, 2000));

                $('.modal.in').modal('hide');
                osProcessadasNestaSessao.add(idDaOS);
                console.log(`   - O.S. ${idDaOS} adicionada à memória da sessão.`);
                console.log('   - Aguardando 2.5 segundos para estabilização...');
                await new Promise(resolve => setTimeout(resolve, 2500));

                // Usa a variável de configuração para o limite de janelas
                if (janelasAbertasPeloScript.length >= MAXIMO_DE_JANELAS_ABERTAS) {
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

    processarTodasAsOrdens();
})();
