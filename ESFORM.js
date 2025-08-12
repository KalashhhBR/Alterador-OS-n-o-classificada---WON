/**
 * ========================================================================================
 * == SCRIPT DE AUTOMAÇÃO DE FORMULÁRIO // termografia - pavimento ==
 * ========================================================================================
 * LÓGICA ATUALIZADA:
 * - A função de validação foi totalmente reescrita. Em vez de "Inserir", o script
 * agora procura por uma validação já existente no campo e clica nela para editar.
 * - O script agora clica no botão "Atualizar" dentro do pop-up de edição de validação.
 */

(function() {
    // ====================================================================================
    // == Bloco de Configuração do Usuário
    // ====================================================================================
    const MAXIMO_DE_JANELAS_ABERTAS = 3;
    const COLUNA_DA_PERGUNTA = 'C';
    const COLUNA_DA_ORDEM = 'D';
    const COLUNA_DO_EDITAR = 'E';
    const COLUNA_DA_VALIDACAO = 'F';
    // ====================================================================================

    if (document.getElementById('botao-fechar-janelas')) {
        console.log("O script de automação já foi injetado.");
        return;
    }

    const janelasAbertasPeloScript = [];
    function fecharTodasAsJanelas() { console.log(`%cFechando ${janelasAbertasPeloScript.length} janelas...`, 'color: #e67e22; font-weight: bold;'); let fechadas = 0; janelasAbertasPeloScript.forEach(janela => { if (janela && !janela.closed) { janela.close(); fechadas++; } }); console.log(`%c${fechadas} janelas foram fechadas.`, 'color: #e67e22;'); janelasAbertasPeloScript.length = 0; atualizarContadorDoBotao(); }
    function criarBotaoDeFechamento() { const botao = document.createElement('button'); botao.id = 'botao-fechar-janelas'; botao.innerHTML = '❌ Fechar Janelas Abertas (0)'; Object.assign(botao.style, { position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000', padding: '12px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }); botao.onclick = fecharTodasAsJanelas; document.body.appendChild(botao); }
    function atualizarContadorDoBotao() { const botao = document.getElementById('botao-fechar-janelas'); if (botao) { const janelasRealmenteAbertas = janelasAbertasPeloScript.filter(j => j && !j.closed).length; botao.innerHTML = `❌ Fechar Janelas Abertas (${janelasRealmenteAbertas})`; } }
    function letraParaIndice(letraColuna) { return letraColuna.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); }
    async function waitForElement(selector, context = document, timeout = 10000) { return new Promise((resolve, reject) => { const startTime = Date.now(); const interval = setInterval(() => { const element = context.querySelector(selector); if (element) { clearInterval(interval); resolve(element); } else if (Date.now() - startTime > timeout) { clearInterval(interval); reject(new Error(`Tempo esgotado: ${selector}`)); } }, 500); }); }

    async function processarFormulario() {
        const urlPlanilha = prompt("Por favor, cole aqui o link '.csv' da sua planilha publicada na web:");
        if (!urlPlanilha || !urlPlanilha.includes('csv')) { alert("Link inválido ou operação cancelada."); return; }

        const indicePergunta = letraParaIndice(COLUNA_DA_PERGUNTA);
        const indiceOrdem = letraParaIndice(COLUNA_DA_ORDEM);
        const indiceEditar = letraParaIndice(COLUNA_DO_EDITAR);
        const indiceValidacao = letraParaIndice(COLUNA_DA_VALIDACAO);

        let tarefasDaPlanilha = [];
        try {
            console.log("Baixando dados da planilha...");
            const response = await fetch(urlPlanilha);
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
            const csvText = await response.text();
            
            const linhas = csvText.trim().split('\n');
            const indiceMaximo = Math.max(indicePergunta, indiceOrdem, indiceEditar, indiceValidacao);

            for (const linha of linhas.slice(1)) {
                const colunas = linha.split(',');
                if (colunas.length > indiceMaximo) {
                    const tarefa = {
                        pergunta: colunas[indicePergunta].trim().replace(/"/g, ''),
                        ordem: colunas[indiceOrdem].trim().replace(/"/g, ''),
                        textoEditar: colunas[indiceEditar].trim().replace(/"/g, ''),
                        textoValidacao: colunas[indiceValidacao].trim().replace(/"/g, '')
                    };
                    if (tarefa.ordem && tarefa.pergunta) { tarefasDaPlanilha.push(tarefa); }
                }
            }
            if (tarefasDaPlanilha.length === 0) throw new Error("Nenhuma tarefa válida foi processada da planilha.");
            console.log(`%cSucesso! ${tarefasDaPlanilha.length} tarefas carregadas da planilha.`, 'color: lightgreen;');
        } catch (error) {
            alert("Falha ao baixar ou processar os dados da planilha."); console.error(error); return;
        }

        console.log("🚀 INICIANDO AUTOMAÇÃO DE FORMULÁRIO 🚀");
        criarBotaoDeFechamento();
        if (typeof $ === 'undefined' || typeof $.fn.modal === 'undefined') { console.error("ERRO CRÍTICO: jQuery ou Bootstrap Modal não encontrados."); return; }
        
        try {
            console.log("Aguardando a lista de campos do formulário carregar...");
            await waitForElement('.list-group.lg-listview .list-group-item.media');
            console.log("Lista de campos encontrada. Iniciando processamento.");
        } catch(error) {
            console.error("ERRO: A lista de campos do formulário não foi encontrada.", error);
            alert("Não foi possível encontrar a lista de campos. O script será encerrado.");
            return;
        }
        
        const todosOsCamposDaPagina = Array.from(document.querySelectorAll('.list-group.lg-listview .list-group-item.media'));

        for (const tarefa of tarefasDaPlanilha) {
            console.log(`%cProcessando Ordem #${tarefa.ordem}...`, 'font-weight: bold; background-color: #f0f0f0; color: black;');

            const campoAlvo = todosOsCamposDaPagina.find(campo => {
                const botaoOrdem = campo.querySelector('.btn.bg-bluegray.btn-icon');
                if (botaoOrdem) {
                    const numeroOrdem = botaoOrdem.innerText.trim().replace(/\*/g, '');
                    return numeroOrdem === tarefa.ordem;
                }
                return false;
            });

            if (!campoAlvo) {
                console.warn(`%c[AVISO] Não encontrei o campo com a ordem #${tarefa.ordem}. Pulando...`, 'color: #f39c12;');
                continue;
            }

            try {
                if (tarefa.pergunta.toLowerCase().includes('qr-code')) {
                    console.log('   - Tipo: Qr-code. Ações: Edição e Validação.');
                    await executarEdicao(campoAlvo, tarefa.textoEditar);
                    await executarEdicaoDeValidacao(campoAlvo, tarefa.textoValidacao);
                } else if (tarefa.pergunta.toLowerCase().includes('título')) {
                    console.log('   - Tipo: Título. Ação: Apenas Edição.');
                    await executarEdicao(campoAlvo, tarefa.textoEditar);
                } else {
                    console.log(`   - Tipo "${tarefa.pergunta}" não corresponde a nenhuma ação. Pulando.`);
                }
            } catch (error) {
                console.error(`ERRO ao processar a ordem #${tarefa.ordem}:`, error);
                if ($('.modal.in').length > 0) { $('.modal.in').modal('hide'); }
            }
        }

        console.log("%c🎉 Trabalho concluído! Todas as tarefas da planilha foram executadas.", "color: green; font-size: 16px; font-weight: bold;");
        fecharTodasAsJanelas();
    }
    
    // --- Funções de Ação ---

    async function executarEdicao(campo, textoParaEditar) {
        console.log(`     - Editando campo para: "${textoParaEditar}"`);
        campo.querySelector('a[data-toggle="dropdown"]').click();
        const botaoEditar = await waitForElement('button[id^="editarCampo"]', campo);
        botaoEditar.click();

        const inputDescricao = await waitForElement('.modal.in input[name="descricaoCampoFormulario"]');
        inputDescricao.value = '';
        inputDescricao.value = textoParaEditar;
        inputDescricao.dispatchEvent(new Event('input', { bubbles: true }));

        const formElement = inputDescricao.closest('form');
        const formModal = inputDescricao.closest('.modal-content');
        if (formElement) {
            const windowName = 'submission_popup_' + Date.now();
            const novaJanela = window.open('', windowName, 'width=800,height=600,scrollbars=yes,resizable=yes');
            if (novaJanela) novaJanela.blur();
            formElement.target = windowName;
            janelasAbertasPeloScript.push(novaJanela);
            atualizarContadorDoBotao();
        }
        
        const btnCadastrar = Array.from(formModal.querySelectorAll('button[type="submit"]')).find(btn => btn.innerText.trim() === 'Cadastrar');
        if(!btnCadastrar) throw new Error("Botão 'Cadastrar' não encontrado no modal de edição.");
        btnCadastrar.click();

        await new Promise(resolve => setTimeout(resolve, 1500));
        if ($('.modal.in').length > 0) { $('.modal.in').modal('hide'); }
        console.log("     - Edição de campo concluída.");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (janelasAbertasPeloScript.length >= MAXIMO_DE_JANELAS_ABERTAS) {
            fecharTodasAsJanelas();
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    
    // --- FUNÇÃO DE VALIDAÇÃO TOTALMENTE REESCRITA ---
    async function executarEdicaoDeValidacao(campo, textoParaValidar) {
        console.log(`     - Editando validação para: "${textoParaValidar}"`);
        
        // 1. Encontra e clica no botão de validação existente diretamente no campo
        const botaoEditarValidacao = campo.querySelector('button[value^="editarValidacao"]');
        if (!botaoEditarValidacao) {
            throw new Error("Botão para editar validação existente não foi encontrado no campo.");
        }
        botaoEditarValidacao.click();

        // 2. Espera pelo pop-up de "Editar Validação" e preenche o campo "Resposta"
        const inputResposta = await waitForElement('.modal.in input[name="respostaParaValidar"]');
        inputResposta.value = '';
        inputResposta.value = textoParaValidar;
        inputResposta.dispatchEvent(new Event('input', { bubbles: true }));
        
        // 3. Configura o envio para uma nova janela para não recarregar a página
        const formElement = inputResposta.closest('form');
        const formModal = inputResposta.closest('.modal-content');
        if (formElement) {
            const windowName = 'submission_popup_' + Date.now();
            const novaJanela = window.open('', windowName, 'width=800,height=600,scrollbars=yes,resizable=yes');
            if(novaJanela) novaJanela.blur();
            formElement.target = windowName;
            janelasAbertasPeloScript.push(novaJanela);
            atualizarContadorDoBotao();
        }
        
        // 4. Encontra e clica no botão "Atualizar"
        const btnAtualizar = Array.from(formModal.querySelectorAll('button[type="submit"]')).find(btn => btn.innerText.trim() === 'Atualizar');
        if (!btnAtualizar) {
            throw new Error("Botão 'Atualizar' não encontrado no modal de validação.");
        }
        btnAtualizar.click();

        // 5. Espera e fecha o modal
        await new Promise(resolve => setTimeout(resolve, 1500));
        if ($('.modal.in').length > 0) { $('.modal.in').modal('hide'); }
        console.log("     - Edição de validação concluída.");
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (janelasAbertasPeloScript.length >= MAXIMO_DE_JANELAS_ABERTAS) {
            fecharTodasAsJanelas();
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    processarFormulario();
})();
