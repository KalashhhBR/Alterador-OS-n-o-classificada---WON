/**
 * ========================================================================================
 * == SCRIPT DE AUTOMAÇÃO - Classificação Por Planilha
 * ========================================================================================
 *
 * Script de classificação feita por planilha CSV gerada pela página filtrada.
 *
 */

(function() {
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
            alert("Link inválido ou operação cancelada. O script não será executado.");
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
            
            for (const linha of linhas.slice(1)) { // Pula o cabeçalho
                const colunas = linha.split(',');
                if (colunas.length >= 2) {
                    const idOS = colunas[0].trim().replace(/"/g, '');
                    const classificacao = colunas[1].trim().replace(/"/g, '');
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
            
            // *** MELHORIA 2: VERIFICAÇÃO PRÉVIA PARA EVITAR RETRABALHO ***
            // Compara o texto da O.S. na página com o da planilha (ignorando maiúsculas/minúsculas).
            if (ordemParaProcessar.innerText.toLowerCase().includes(classificacaoEscolhida.toLowerCase())) {
                console.warn(`%c[JÁ CORRETO] O.S. ID: ${idDaOS} já está classificada como "${classificacaoEscolhida}". Pulando...`, 'color: #3498db;');
                osProcessadasNestaSessao.add(idDaOS); // Marca como processada para não verificar de novo.
                await new Promise(resolve => setTimeout(resolve, 50)); // Pausa mínima
                continue; // Pula para a próxima O.S. no loop.
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
                
                // *** MELHORIA 1: LÓGICA CASE-INSENSITIVE PARA SELECIONAR A OPÇÃO ***
                const todasAsOpcoes = Array.from(select.options);
                const opcaoCorreta = todasAsOpcoes.find(opt => opt.textContent.toLowerCase() === classificacaoEscolhida.toLowerCase());

                if (opcaoCorreta) {
                    select.value = opcaoCorreta.value; // Usa o valor exato da opção encontrada
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`   - Classificação preenchida: "${opcaoCorreta.textContent}"`);
                } else {
                    // Se não encontrar uma opção correspondente, pula esta O.S. com um erro.
                    console.error(`   - ERRO: A classificação "${classificacaoEscolhida}" da planilha não foi encontrada nas opções do formulário para a OS ${idDaOS}.`);
                    $('.modal.in').modal('hide'); // Tenta fechar o modal
                    osProcessadasNestaSessao.add(idDaOS); // Marca como processada para não tentar de novo
                    continue; // Pula para a próxima O.S.
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

    processarTodasAsOrdens();

})();
