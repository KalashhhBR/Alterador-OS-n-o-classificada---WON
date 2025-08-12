/**
 * ========================================================================================
 * == CLPP - Dicinário, paginação, verificação e configurações. ==
 * ========================================================================================
 */

(function() {
    // ====================================================================================
    // == Bloco de Configuração do Usuário
    // ====================================================================================
    const MAXIMO_DE_JANELAS_ABERTAS = 5;
    const COLUNA_DO_ID = 'A';
    const COLUNA_DA_CLASSIFICACAO = 'B';
    const ALIASES_DE_CLASSIFICACAO = {
        'sla': 'Corretiva',
        'planejada': 'Corretiva Planejada'
    };
    const CLASSIFICACOES_PERMITIDAS = new Set([
        'corretiva', 'corretiva planejada', 'atendimento',
        'melhoria', 'acompanhamento'
    ]);
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

    function letraParaIndice(letraColuna) {
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

        const indiceIdOS = letraParaIndice(COLUNA_DO_ID);
        const indiceClassificacao = letraParaIndice(COLUNA_DA_CLASSIFICACAO);

        if (isNaN(indiceIdOS) || isNaN(indiceClassificacao) || indiceIdOS < 0 || indiceClassificacao < 0) {
            alert("Configuração de colunas inválida! Use letras como 'A', 'B', etc.");
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
                if (colunas.length > indiceMaximo) {
                    const idOS = colunas[indiceIdOS].trim().replace(/"/g, '');
                    const classificacao = colunas[indiceClassificacao].trim().replace(/"/g, '');
                    if (idOS && classificacao) { DADOS_DA_PLANILHA[idOS] = classificacao; }
                }
            }
            if (Object.keys(DADOS_DA_PLANILHA).length === 0) throw new Error("Nenhum dado válido foi processado.");
            console.log(`%cSucesso! ${Object.keys(DADOS_DA_PLANILHA).length} mapeamentos carregados.`, 'color: lightgreen;');
        } catch (error) {
            alert("Falha ao baixar ou processar os dados da planilha.");
            console.error(error);
            return;
        }

        console.log("🚀 INICIANDO AUTOMAÇÃO COM DADOS AO VIVO 🚀");
        criarBotaoDeFechamento();
        if (typeof $ === 'undefined' || typeof $.fn.modal === 'undefined') {
            console.error("ERRO CRÍTICO: jQuery ou Bootstrap Modal não encontrados.");
            return;
        }

        const osProcessadasNestaSessao = new Set();
        let paginaAtual = 1;
        while (true) {
            console.log(`%c--- Verificando Página ${paginaAtual} ---`, 'font-weight: bold; background-color: #f0f0f0; color: black;');
            const todasAsOrdensNaPagina = Array.from(document.querySelectorAll('#solicitacoesPendentes .list-group-item.media'));

            for (const ordemParaProcessar of todasAsOrdensNaPagina) {
                const idInput = ordemParaProcessar.querySelector('input.selecionado[id]');
                // Pula se o elemento não tem ID ou se já foi totalmente resolvido nesta sessão.
                if (!idInput || osProcessadasNestaSessao.has(idInput.id)) {
                    continue;
                }

                const idDaOS = idInput.id;
                const classificacaoOriginal = DADOS_DA_PLANILHA[idDaOS];

                // Se a O.S. da página não está na nossa planilha, ela é irrelevante.
                // A marcamos como processada e pulamos.
                if (!classificacaoOriginal) {
                    osProcessadasNestaSessao.add(idDaOS);
                    continue;
                }

                const classificacaoLimpa = classificacaoOriginal.toLowerCase().trim();
                const classificacaoFinal = ALIASES_DE_CLASSIFICACAO[classificacaoLimpa] || classificacaoOriginal;

                // Se a classificação final não é permitida, a O.S. é irrelevante.
                // A marcamos como processada e pulamos.
                if (!CLASSIFICACOES_PERMITIDAS.has(classificacaoFinal.toLowerCase().trim())) {
                    console.warn(`%c[NÃO PERMITIDO] A classificação "${classificacaoFinal}" para a OS ${idDaOS} não está na lista. Pulando...`, 'color: #e74c3c;');
                    osProcessadasNestaSessao.add(idDaOS);
                    continue;
                }

                let classificacaoAtual = null;
                const match = ordemParaProcessar.innerText.match(/Classificação de O\.S\.\s*:\s*(.*)/i);
                if (match && match[1]) { classificacaoAtual = match[1].trim(); }

                // Se a O.S. já está com a classificação correta, não há nada a fazer.
                // A marcamos como processada e pulamos.
                if (classificacaoAtual && classificacaoAtual.toLowerCase() === classificacaoFinal.toLowerCase()) {
                    console.warn(`%c[JÁ CORRETO] O.S. ID: ${idDaOS} já está classificada como "${classificacaoFinal}". Pulando...`, 'color: #3498db;');
                    osProcessadasNestaSessao.add(idDaOS);
                    continue;
                }

                // Se passou por todas as verificações, é uma O.S. que precisa de ação.
                console.log(`%c[AÇÃO NECESSÁRIA] O.S. ID: ${idDaOS} -> Mudar para: "${classificacaoFinal}"`, "color: orange; font-weight: bold;");

                try {
                    ordemParaProcessar.querySelector('a[data-toggle="dropdown"]').click();
                    await new Promise(resolve => setTimeout(resolve, 200));
                    ordemParaProcessar.querySelector(`a[id="aceitar|${idDaOS}"]`).click();

                    const form = await waitForElement('form[action*="aceitarSolicitacao"]');
                    const windowName = 'os_submission_' + idDaOS;
                    const windowFeatures = 'width=360,height=270,scrollbars=yes,resizable=yes';
                    const novaJanela = window.open('', windowName, windowFeatures);
                    if (novaJanela) novaJanela.blur();
                    janelasAbertasPeloScript.push(novaJanela);
                    atualizarContadorDoBotao();
                    form.target = windowName;

                    const select = await waitForElement("select[name^='preenchimentoPadrao_']", form);
                    const todasAsOpcoes = Array.from(select.options);
                    const opcaoCorreta = todasAsOpcoes.find(opt => opt.textContent.toLowerCase() === classificacaoFinal.toLowerCase());

                    if (opcaoCorreta) {
                        select.value = opcaoCorreta.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`   - Classificação preenchida: "${opcaoCorreta.textContent}"`);
                    } else {
                        console.error(`   - ERRO: A classificação "${classificacaoFinal}" não foi encontrada no formulário.`);
                        $('.modal.in').modal('hide');
                        osProcessadasNestaSessao.add(idDaOS); // Marca como processada mesmo com erro para não tentar de novo.
                        continue;
                    }

                    const btnSalvar = Array.from(form.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Salvar');
                    btnSalvar.onclick = () => true;
                    btnSalvar.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    $('.modal.in').modal('hide');
                    // Somente após uma ação bem-sucedida, garantimos que ela está na memória.
                    osProcessadasNestaSessao.add(idDaOS);
                    console.log(`   - O.S. ${idDaOS} processada e adicionada à memória.`);
                    console.log('   - Aguardando 1.8 segundos para estabilização...');
                    await new Promise(resolve => setTimeout(resolve, 1800));

                    if (janelasAbertasPeloScript.length >= MAXIMO_DE_JANELAS_ABERTAS) {
                        fecharTodasAsJanelas();
                        console.log('   - Pausa adicional de 1.5 segundos após a limpeza.');
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                } catch (error) {
                    console.error(`ERRO no processamento da OS ${idDaOS}:`, error);
                    console.log(`%c   - A O.S. ${idDaOS} falhou, mas o script continuará.`, 'color: red;');
                    if ($('.modal.in').length > 0) { $('.modal.in').modal('hide'); }
                    osProcessadasNestaSessao.add(idDaOS); // Adiciona na memória para não tentar de novo com uma O.S. quebrada.
                    continue;
                }
            }

            const activePageLi = document.querySelector('.pagination li.active');
            if (!activePageLi) { break; }
            const nextPageLi = activePageLi.nextElementSibling;
            
            if (nextPageLi && !nextPageLi.classList.contains('disabled') && nextPageLi.querySelector('a')) {
                console.log("Próxima página encontrada. Navegando...");
                nextPageLi.querySelector('a').click();
                paginaAtual++;
                await new Promise(resolve => setTimeout(resolve, 4000));
            } else {
                break;
            }
        }
        
        console.log("%c🎉 Trabalho concluído em todas as páginas! Limpando janelas finais...", "color: green; font-size: 16px; font-weight: bold;");
        fecharTodasAsJanelas();
    }
    
    processarTodasAsOrdens();
})();
