/**
 * ========================================================================================
 * == SCRIPT DE AUTOMAÇÃO (VERSÃO FINAL - MAPEAMENTO E PERMISSÕES) ==
 * ========================================================================================
 *
 * LÓGICAS ATUALIZADAS:
 * 1. Mapeamento de Apelidos: Converte automaticamente textos da planilha (ex: "SLA")
 * para os valores oficiais do sistema (ex: "Corretiva").
 * 2. Lista de Permissões: O script só processará as classificações que estiverem
 * explicitamente permitidas, ignorando outras como "Cancelada", "Fechar OS", etc.
 *
 */

(function() {
    // ====================================================================================
    // == Bloco de Configuração do Usuário
    // ====================================================================================
    // Modifique as variáveis abaixo para personalizar o comportamento do script.
    // ------------------------------------------------------------------------------------

    /** (Config 1) Defina o número máximo de janelas que podem ser abertas antes da limpeza automática. */
    const MAXIMO_DE_JANELAS_ABERTAS = 5;

    /** (Config 2) Qual coluna da sua planilha contém o ID da Solicitação? (Use a letra) */
    const COLUNA_DO_ID = 'A';

    /** (Config 3) Qual coluna da sua planilha contém o texto da Classificação? (Use a letra) */
    const COLUNA_DA_CLASSIFICACAO = 'B';

    /**
     * (Config 4) Crie apelidos para suas classificações.
     * O script converterá o texto da esquerda (o que está na sua planilha, em minúsculas)
     * para o texto da direita (o valor oficial no sistema).
     */
    const ALIASES_DE_CLASSIFICACAO = {
        'sla': 'Corretiva',
        'planejada': 'Corretiva Planejada'
        // Adicione mais apelidos aqui, se necessário. Ex: 'melhoria de sistema': 'Melhoria',
    };

    /**
     * (Config 5) Lista de classificações que o script tem permissão para processar.
     * O script irá IGNORAR qualquer O.S. cuja classificação final não esteja nesta lista.
     * (Os valores aqui devem ser os oficiais do sistema, não os apelidos).
     */
    const CLASSIFICACOES_PERMITIDAS = new Set([
        'Corretiva',
        'Corretiva Planejada',
        'Atendimento',
        'Melhoria',
        'Acompanhamento'
    ]);

    // ====================================================================================
    // == FIM DA CONFIGURAÇÃO - Não é necessário alterar mais nada abaixo.
    // ====================================================================================

    if (document.getElementById('botao-fechar-janelas')) {
        console.log("O script de automação já foi injetado.");
        return;
    }

    const janelasAbertasPeloScript = [];
    function fecharTodasAsJanelas() { /* ...código de fechamento... */ }
    function criarBotaoDeFechamento() { /* ...código do botão... */ }
    function atualizarContadorDoBotao() { /* ...código do contador... */ }
    function letraParaIndice(letraColuna) { return letraColuna.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); }
    async function waitForElement(selector, context = document, timeout = 10000) { /* ...código de espera... */ }
    (function(fechar, criar, atualizar) { fecharTodasAsJanelas = fechar; criarBotaoDeFechamento = criar; atualizarContadorDoBotao = atualizar; })(fecharTodasAsJanelas, criarBotaoDeFechamento, atualizarContadorDoBotao); // Helper para o snippet

    async function processarTodasAsOrdens() {
        const urlPlanilha = prompt("Por favor, cole aqui o link '.csv' da sua planilha publicada na web:");
        if (!urlPlanilha || !urlPlanilha.includes('csv')) { alert("Link inválido ou operação cancelada."); return; }

        const indiceIdOS = letraParaIndice(COLUNA_DO_ID);
        const indiceClassificacao = letraParaIndice(COLUNA_DA_CLASSIFICACAO);
        if (isNaN(indiceIdOS) || isNaN(indiceClassificacao) || indiceIdOS < 0 || indiceClassificacao < 0) {
            alert("Configuração de colunas inválida! Use letras como 'A', 'B', etc."); return;
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
            alert("Falha ao baixar ou processar os dados da planilha."); console.error(error); return;
        }

        console.log("🚀 INICIANDO AUTOMAÇÃO COM DADOS AO VIVO 🚀");
        criarBotaoDeFechamento();
        if (typeof $ === 'undefined' || typeof $.fn.modal === 'undefined') { console.error("ERRO CRÍTICO: jQuery ou Bootstrap Modal não encontrados."); return; }

        const osProcessadasNestaSessao = new Set();
        let paginaAtual = 1;
        while (true) {
            console.log(`%c--- Verificando Página ${paginaAtual} ---`, 'font-weight: bold; background-color: #f0f0f0; color: black;');
            
            // Pega todas as O.S. visíveis na página para a verificação.
            const todasAsOrdensNaPagina = Array.from(document.querySelectorAll('#solicitacoesPendentes .list-group-item.media'));
            let algumaAcaoFeitaNestaPagina = false;

            for (const ordemParaProcessar of todasAsOrdensNaPagina) {
                const idInput = ordemParaProcessar.querySelector('input.selecionado[id]');
                if (!idInput || osProcessadasNestaSessao.has(idInput.id)) {
                    continue; // Pula se não tiver ID ou se já foi processada
                }

                const idDaOS = idInput.id;
                osProcessadasNestaSessao.add(idDaOS); // Marca como 'vista' para não reprocessar na mesma sessão.

                const classificacaoOriginal = DADOS_DA_PLANILHA[idDaOS];
                if (!classificacaoOriginal) {
                    continue; // Pula se a O.S. da página não está na nossa planilha.
                }

                // --- LÓGICA DE MAPEAMENTO E PERMISSÕES ---
                const classificacaoLimpa = classificacaoOriginal.toLowerCase().trim();
                const classificacaoFinal = ALIASES_DE_CLASSIFICACAO[classificacaoLimpa] || classificacaoOriginal;
                
                if (!CLASSIFICACOES_PERMITIDAS.has(classificacaoFinal)) {
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
                algumaAcaoFeitaNestaPagina = true;

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
                        console.error(`   - ERRO: A classificação "${classificacaoFinal}" não foi encontrada no formulário para a OS ${idDaOS}.`);
                        $('.modal.in').modal('hide');
                        continue;
                    }

                    const btnSalvar = Array.from(form.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Salvar');
                    btnSalvar.onclick = () => true;
                    btnSalvar.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    $('.modal.in').modal('hide');
                    console.log(`   - O.S. ${idDaOS} processada com sucesso.`);
                    console.log('   - Aguardando 2.5 segundos para estabilização...');
                    await new Promise(resolve => setTimeout(resolve, 2500));

                    if (janelasAbertasPeloScript.length >= MAXIMO_DE_JANELAS_ABERTAS) {
                        fecharTodasAsJanelas();
                        console.log('   - Pausa adicional de 2 segundos após a limpeza.');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error) {
                    console.error(`ERRO no processamento da OS ${idDaOS}:`, error);
                    console.log("A automação será interrompida. Fechando janelas...");
                    fecharTodasAsJanelas();
                    return; // Retorna para parar tudo.
                }
            } // Fim do loop FOR que itera sobre as O.S. da página.

            // --- LÓGICA DE PAGINAÇÃO ---
            const activePageLi = document.querySelector('.pagination li.active');
            if (!activePageLi) { break; } // Se não há paginação, encerra.
            const nextPageLi = activePageLi.nextElementSibling;
            
            if (nextPageLi && !nextPageLi.classList.contains('disabled') && nextPageLi.querySelector('a')) {
                console.log("Próxima página encontrada. Navegando...");
                nextPageLi.querySelector('a').click();
                paginaAtual++;
                await new Promise(resolve => setTimeout(resolve, 4000)); // Espera a nova página carregar.
            } else {
                break; // Se não houver próxima página, encerra.
            }
        } // Fim do loop de PÁGINA (externo)
        
        console.log("%c🎉 Trabalho concluído em todas as páginas! Limpando janelas finais...", "color: green; font-size: 16px; font-weight: bold;");
        fecharTodasAsJanelas();
    }
    
    // O código completo das funções auxiliares precisa estar aqui para funcionar.
    (function() {
        this.fecharTodasAsJanelas = fecharTodasAsJanelas;
        this.criarBotaoDeFechamento = criarBotaoDeFechamento;
        this.atualizarContadorDoBotao = atualizarContadorDoBotao;
        this.letraParaIndice = letraParaIndice;
        this.waitForElement = waitForElement;
        this.processarTodasAsOrdens = processarTodasAsOrdens;
    }).call(window);

    processarTodasAsOrdens();
})();
