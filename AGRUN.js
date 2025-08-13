/**
 * ========================================================================================
 * == SCRIPT AGRUN (Alteração de Grupo Responsável Único) - VERSÃO OTIMIZADA E DOCUMENTADA ==
 * ========================================================================================
 *
 * FUNÇÃO:
 * Este script aplica uma alteração em massa de Grupo, Atividade e Objeto para TODAS
 * as Ordens de Serviço (O.S.) listadas na página e em suas sub-páginas.
 * Ele não faz verificações prévias, simplesmente executa a alteração em cada O.S.
 * uma única vez por sessão.
 *
 * OTIMIZAÇÃO:
 * O tempo de espera entre a seleção dos dropdowns (Grupo, Atividade, Objeto) foi
 * reduzido para acelerar significativamente o processo de automação.
 *
 */

// Usamos uma IIFE (Immediately Invoked Function Expression) para encapsular todo o nosso código,
// criando um escopo privado e evitando conflitos com os scripts do site.
(function() {
    // ====================================================================================
    // == Bloco de Configuração do Usuário
    // ====================================================================================
    // PREENCHA AS 3 VARIÁVEIS ABAIXO COM OS VALORES EXATOS DESEJADOS.
    // O script buscará pelas opções sem diferenciar maiúsculas de minúsculas.
    // ------------------------------------------------------------------------------------

    const GRUPO_ALVO = "NOME EXATO DO GRUPO"; // Ex: "[SENADO] TEMON - CIVIL"
    const ATIVIDADE_ALVO = "NOME EXATO DA ATIVIDADE"; // Ex: "Instalação"
    const OBJETO_ALVO = "NOME EXATO DO OBJETO"; // Ex: "Ralo / Grelha"

    // (Opcional) Número máximo de janelas pop-up abertas antes da limpeza automática.
    const MAXIMO_DE_JANELAS_ABERTAS = 5;

    // ====================================================================================
    // == FIM DA CONFIGURAÇÃO - Não é necessário alterar mais nada abaixo.
    // ====================================================================================


    // --- Bloco 1: Gerenciamento de Janelas e UI ---
    // Este conjunto de funções controla as janelas pop-up e o botão de controle.

    /** Verificação de segurança para impedir que o script seja injetado múltiplas vezes. */
    if (document.getElementById('clun-gao-control-panel')) {
        console.log("O script de automação já foi injetado nesta página.");
        return;
    }
    /** @type {Window[]} Array que armazena as referências de todas as janelas abertas. */
    const janelasAbertasPeloScript = [];
    /** Fecha todas as janelas pop-up abertas pelo script. */
    function fecharTodasAsJanelas() { console.log(`%cFechando ${janelasAbertasPeloScript.length} janelas...`, 'color: #e67e22; font-weight: bold;'); let fechadas = 0; janelasAbertasPeloScript.forEach(janela => { if (janela && !janela.closed) { janela.close(); fechadas++; } }); console.log(`%c${fechadas} janelas foram fechadas.`, 'color: #e67e22;'); janelasAbertasPeloScript.length = 0; atualizarContadorDoBotao(); }
    /** Cria um botão na tela para fechar as janelas manualmente. */
    function criarBotaoDeFechamento() { const botao = document.createElement('button'); botao.id = 'clun-gao-control-panel'; botao.innerHTML = '❌ Fechar Janelas Pop-up (0)'; Object.assign(botao.style, { position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000', padding: '12px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }); botao.onclick = fecharTodasAsJanelas; document.body.appendChild(botao); }
    /** Atualiza o contador de janelas abertas no botão. */
    function atualizarContadorDoBotao() { const botao = document.getElementById('clun-gao-control-panel'); if (botao) { const janelasRealmenteAbertas = janelasAbertasPeloScript.filter(j => j && !j.closed).length; botao.innerHTML = `❌ Fechar Janelas Pop-up (${janelasRealmenteAbertas})`; } }
    
    // --- Bloco 2: Funções Auxiliares ---

    /**
     * Pausa o script até que um elemento específico apareça na página.
     * @param {string} selector - O seletor CSS do elemento esperado.
     * @returns {Promise<Element>} Uma promessa que retorna o elemento encontrado.
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

    /**
     * Seleciona uma opção em um dropdown complexo (selectpicker) de forma robusta.
     * @param {string} nameAttribute - O atributo 'name' do <select> (ex: 'idGrupo').
     * @param {string} textoDesejado - O texto da opção a ser selecionada.
     */
    async function selecionarOpcao(nameAttribute, textoDesejado) {
        const selectElement = await waitForElement(`.modal.in select[name="${nameAttribute}"]`);
        const textoLowerCase = textoDesejado.toLowerCase().trim();
        const todasAsOpcoes = Array.from(selectElement.options);
        const opcaoCorreta = todasAsOpcoes.find(opt => opt.textContent.toLowerCase().trim() === textoLowerCase);

        if (opcaoCorreta) {
            console.log(`   - Encontrou e selecionou "${opcaoCorreta.textContent}" para ${nameAttribute}.`);
            selectElement.value = opcaoCorreta.value;
            selectElement.dispatchEvent(new Event('change', { bubbles: true })); // Dispara o evento para o site carregar as próximas opções.

            // *** OTIMIZAÇÃO DE VELOCIDADE ***
            // O tempo de espera foi reduzido de 2000ms para 750ms para acelerar o processo.
            // Se o script falhar (ex: não encontrar uma opção de Atividade ou Objeto),
            // aumente este valor para 1000 ou 1500.
            await new Promise(resolve => setTimeout(resolve, 750));
            
        } else {
            throw new Error(`A opção "${textoDesejado}" não foi encontrada no dropdown "${nameAttribute}".`);
        }
    }

    // --- Bloco 3: Orquestrador Principal ---
    
    /**
     * A função mestre que executa todo o fluxo de automação.
     */
    async function processarTodasAsOrdens() {
        console.log(`🚀 INICIANDO ALTERAÇÃO EM MASSA 🚀`);
        console.log(`Valores a serem aplicados:`, { GRUPO_ALVO, ATIVIDADE_ALVO, OBJETO_ALVO });
        criarBotaoDeFechamento();

        if (typeof $ === 'undefined' || typeof $.fn.modal === 'undefined') { console.error("ERRO CRÍTICO: jQuery ou Bootstrap Modal não encontrados."); return; }

        const osProcessadasNestaSessao = new Set();
        let paginaAtual = 1;

        // Loop de Paginação (Externo): continua enquanto houver próximas páginas.
        while (true) {
            console.log(`%c--- Verificando Página ${paginaAtual} ---`, 'font-weight: bold; background-color: #f0f0f0; color: black;');
            
            // Filtra e pega todas as O.S. da página que ainda não foram processadas.
            const ordensParaProcessar = Array.from(document.querySelectorAll('#solicitacoesPendentes .list-group-item.media')).filter(ordem => {
                const idInput = ordem.querySelector('input.selecionado[id]');
                return idInput && !osProcessadasNestaSessao.has(idInput.id);
            });

            if (ordensParaProcessar.length === 0) {
                console.log("Nenhuma O.S. nova para processar nesta página.");
            }

            // Loop de O.S. (Interno): processa cada O.S. da página atual.
            for (const ordem of ordensParaProcessar) {
                const idDaOS = ordem.querySelector('input.selecionado[id]').id;
                console.log(`%c[PROCESSANDO] O.S. ID: ${idDaOS}...`, "color: orange; font-weight: bold;");

                // Bloco try...catch garante que um erro em uma O.S. não pare o script inteiro.
                try {
                    // 1. Abre o formulário (modal) da O.S.
                    ordem.querySelector('a[data-toggle="dropdown"]').click();
                    await new Promise(resolve => setTimeout(resolve, 200));
                    ordem.querySelector(`a[id^="aceitar|"]`).click();

                    const formElement = await waitForElement('.modal.in form');

                    // 2. Seleciona as opções em cascata, com pausas otimizadas entre elas.
                    await selecionarOpcao('idGrupo', GRUPO_ALVO);
                    await selecionarOpcao('idAtividade', ATIVIDADE_ALVO);
                    await selecionarOpcao('idObjeto', OBJETO_ALVO);
                    
                    // 3. Prepara o envio para uma nova janela para não recarregar a página.
                    const windowName = 'submission_popup_' + idDaOS;
                    const windowFeatures = 'width=1,height=1,left=9999,top=9999';
                    const novaJanela = window.open('', windowName, windowFeatures);
                    if (novaJanela) novaJanela.blur();

                    formElement.target = windowName;
                    janelasAbertasPeloScript.push(novaJanela);
                    atualizarContadorDoBotao();

                    // 4. Força o envio direto do formulário, ignorando scripts do botão "Salvar".
                    console.log("   - Forçando o envio do formulário para a nova janela...");
                    formElement.submit();

                    // 5. Limpeza pós-ação.
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    if ($('.modal.in').length > 0) { $('.modal.in').modal('hide'); }
                    osProcessadasNestaSessao.add(idDaOS); // Adiciona na memória após o sucesso.
                    console.log(`%c[SUCESSO] OS ${idDaOS} processada.`, "color: lightblue;");
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // 6. Gerenciamento automático de janelas.
                    if (janelasAbertasPeloScript.length >= MAXIMO_DE_JANELAS_ABERTAS) {
                        fecharTodasAsJanelas();
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }

                } catch (error) {
                    console.error(`ERRO no processamento da OS ${idDaOS}:`, error);
                    if ($('.modal.in').length > 0) { $('.modal.in').modal('hide'); }
                    osProcessadasNestaSessao.add(idDaOS);
                    continue; // Pula para a próxima O.S.
                }
            }

            // 7. Lógica de Paginação.
            const activePageLi = document.querySelector('.pagination li.active');
            if (!activePageLi) { break; } // Encerra se não houver paginação.
            const nextPageLi = activePageLi.nextElementSibling;
            
            if (nextPageLi && !nextPageLi.classList.contains('disabled') && nextPageLi.querySelector('a')) {
                console.log("Próxima página encontrada. Navegando...");
                nextPageLi.querySelector('a').click();
                paginaAtual++;
                await new Promise(resolve => setTimeout(resolve, 4000)); // Espera a nova página carregar.
            } else {
                break; // Encerra se estiver na última página.
            }
        }
        
        console.log("%c🎉 Trabalho concluído em todas as páginas!", "color: green; font-size: 16px; font-weight: bold;");
        fecharTodasAsJanelas();
    }

    // Ponto de entrada: chama a função principal para iniciar todo o processo.
    processarTodasAsOrdens();

})();
