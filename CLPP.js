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
    // A lista de permissões agora é criada em minúsculas para a verificação.
    const CLASSIFICACOES_PERMITIDAS = new Set([
        'corretiva',
        'corretiva planejada',
        'atendimento',
        'melhoria',
        'acompanhamento'
    ]);
    // ====================================================================================
    // == FIM DA CONFIGURAÇÃO
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
                if (colunas.length > indiceMaximo) {
                    const idOS = colunas[indiceIdOS].trim().replace(/"/g, '');
                    const classificacao = colunas[indiceClassificacao].trim().replace(/"/g, '');
                    if (idOS && classificacao) { DADOS_DA_PLANILHA[idOS] = classificacao; }
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
        let paginaAtual = 1;
        while (true) {
             console.log(`%c--- Verificando Página ${paginaAtual} ---`, 'font-weight: bold; background-color: #f0f0f0; color: black;');
            
            const todasAsOrdensNaPagina = Array.from(document.querySelectorAll('#solicitacoesPendentes .list-group-item.media'));

            for (const ordemParaProcessar of todasAsOrdensNaPagina) {
                const idInput = ordemParaProcessar.querySelector('input.selecionado[id]');
                if (!idInput || osProcessadasNestaSessao.has(idInput.id)) {
                    continue; 
                }

                const idDaOS = idInput.id;
                osProcessadasNestaSessao.add(idDaOS); 

                const classificacaoOriginal = DADOS_DA_PLANILHA[idDaOS];
                if (!classificacaoOriginal) {
                    continue; 
                }

                const classificacaoLimpa = classificacaoOriginal.toLowerCase().trim();
                const classificacaoFinal = ALIASES_DE_CLASSIFICACAO[classificacaoLimpa] || classificacaoOriginal;
                
                // *** CORREÇÃO 1: VERIFICAÇÃO DE PERMISSÃO CASE-INSENSITIVE ***
                if (!CLASSIFICACOES_PERMITIDAS.has(classificacaoFinal.toLowerCase().trim())) {
                    console.warn(`%c[NÃO PERMITIDO] A classificação "${classificacaoFinal}" para a OS ${idDaOS} não está na lista de permissões. Pulando...`, 'color: #e74c3c;');
                    continue;
                }
                
                let classificacaoAtual = null;
                const match = ordemParaProcessar.innerText.match(/Classificação de O\.S\.\s*:\s*(.*)/i);
                if (match && match[1]) { classificacaoAtual = match[1].trim(); }

                if (classificacaoAtual && classificacaoAtual.toLowerCase() === classificacaoFinal.toLowerCase()) {
                    console.warn(`%c[JÁ CORRETO] O.S. ID: ${idDaOS} já está classificada como "${classificacaoFinal}". Pulando...`, 'color: #3498db;');
                    continue;
                }
                
                console.log(`%c[AÇÃO NECESSÁRIA] O.S. ID: ${idDaOS} -> Mudar para: "${classificacaoFinal}"`, "color: orange; font-weight: bold;");

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
                    const opcaoCorreta = todasAsOpcoes.find(opt => opt.textContent.toLowerCase() === classificacaoFinal.toLowerCase());

                    if (opcaoCorreta) {
                        select.value = opcaoCorreta.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`   - Classificação preenchida: "${opcaoCorreta.textContent}"`);
                    } else {
                        console.error(`   - ERRO: A classificação "${classificacaoFinal}" não foi encontrada no formulário.`);
                        $('.modal.in').modal('hide');
                        continue;
                    }

                    const btnSalvar = Array.from(form.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Salvar');
                    btnSalvar.onclick = () => true;
                    btnSalvar.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    $('.modal.in').modal('hide');
                    console.log(`   - O.S. ${idDaOS} processada com sucesso.`);
                    console.log('   - Aguardando 2 segundos para estabilização...');
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    if (janelasAbertasPeloScript.length >= MAXIMO_DE_JANELAS_ABERTAS) {
                        fecharTodasAsJanelas();
                        console.log('   - Pausa adicional de 2 segundos após a limpeza.');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error) {
                    // *** CORREÇÃO 2: TRATAMENTO DE ERRO MAIS RESILIENTE ***
                    console.error(`ERRO no processamento da OS ${idDaOS}:`, error);
                    console.log(`%c   - A O.S. ${idDaOS} falhou, mas o script continuará para a próxima.`, 'color: red;');
                    // Tenta fechar o modal se ele ficou aberto
                    if ($('.modal.in').length > 0) {
                        $('.modal.in').modal('hide');
                    }
                    continue; // Pula para a próxima O.S. em vez de parar tudo.
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
