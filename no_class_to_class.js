/**
 * =====================================================================================
 * == SCRIPT DE AUTOMAÇÃO DE CLASSIFICAÇÃO DE O.S. (VERSÃO FINAL DOCUMENTADA) ==
 * =====================================================================================
 *
 * Este script automatiza o processo de classificação de Ordens de Serviço (O.S.)
 * em uma página web. Ele identifica O.S. não classificadas, abre um formulário
 * de edição, preenche com dados, salva (abrindo o resultado em uma nova janela
 * para não interromper o fluxo), e gerencia as janelas abertas para não sobrecarregar
 * o sistema.
 *
 */


// --- SEÇÃO DE GERENCIAMENTO DE JANELAS ---

/**
 * @type {Window[]}
 * Array global que armazena as referências (handles) de todas as janelas
 * pop-up abertas pelo script. É a "memória" de quais janelas precisam ser gerenciadas.
 */
const janelasAbertasPeloScript = [];

/**
 * Itera sobre o array `janelasAbertasPeloScript` e fecha cada janela que ainda
 * estiver aberta. Ao final, limpa o array para recomeçar a contagem.
 * Esta função é o núcleo do gerenciamento de memória.
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
}

/**
 * Cria e injeta um botão flutuante na página. Este botão serve como um controle
 * manual de emergência para o usuário fechar todas as janelas pop-up
 * a qualquer momento. Ele só é criado uma vez.
 */
function criarBotaoDeFechamento() {
    // Se o botão já existe, não faz nada.
    if (document.getElementById('botao-fechar-janelas')) return;

    const botao = document.createElement('button');
    botao.id = 'botao-fechar-janelas';
    botao.innerHTML = '❌ Fechar Janelas Abertas (0)';
    // Estiliza o botão para ficar visível e acessível.
    Object.assign(botao.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '10000',
        padding: '12px 20px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    });
    // Associa a função de fechamento ao clique do botão.
    botao.onclick = fecharTodasAsJanelas;
    document.body.appendChild(botao);
}

/**
 * Atualiza o texto do botão flutuante para mostrar quantas janelas
 * estão atualmente abertas, fornecendo feedback visual ao usuário.
 */
function atualizarContadorDoBotao() {
    const botao = document.getElementById('botao-fechar-janelas');
    if (botao) {
        // Filtra o array para contar apenas as janelas que o navegador confirma que ainda estão abertas.
        const janelasRealmenteAbertas = janelasAbertasPeloScript.filter(j => j && !j.closed).length;
        botao.innerHTML = `❌ Fechar Janelas Abertas (${janelasRealmenteAbertas})`;
    }
}

// --- SEÇÃO DE FUNÇÕES AUXILIARES ---

/**
 * Função assíncrona crucial para lidar com conteúdo dinâmico.
 * Ela pausa a execução do script e fica verificando a cada 500ms se um
 * elemento (definido pelo `selector`) já apareceu na página.
 * Resolve a promessa quando o elemento é encontrado ou rejeita se o tempo (`timeout`) esgotar.
 * @param {string} selector - O seletor CSS do elemento que estamos esperando.
 * @param {Document|Element} context - Onde procurar pelo elemento (padrão: todo o documento).
 * @param {number} timeout - Tempo máximo de espera em milissegundos.
 * @returns {Promise<Element>} O elemento encontrado.
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
                reject(new Error(`Tempo esgotado: ${selector}`));
            }
        }, 500);
    });
}

// --- SEÇÃO PRINCIPAL DE EXECUÇÃO ---

/**
 * Função principal que orquestra todo o fluxo de automação.
 */
async function processarTodasAsOrdens() {
    console.log("🚀 INICIANDO AUTOMAÇÃO (VERSÃO FINAL - FOCO PASSIVO) 🚀");
    criarBotaoDeFechamento();

    // Verificação de segurança para garantir que a página possui as bibliotecas necessárias.
    if (typeof $ === 'undefined' || typeof $.fn.modal === 'undefined') {
        console.error("ERRO CRÍTICO: jQuery ou Bootstrap Modal não encontrados.");
        return;
    }

    // Cria um "Set", uma estrutura de dados otimizada para armazenar valores únicos.
    // Usamos para guardar os IDs das O.S. já processadas nesta sessão e evitar retrabalho.
    const osProcessadasNestaSessao = new Set();

    // Loop principal. Ele continuará rodando enquanto houver O.S. para processar.
    while (true) {
        // Encontra a primeira O.S. na lista que satisfaz duas condições:
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
            atualizarContadorDoBotao();
            break; // Encerra o loop 'while'.
        }

        const idDaOS = ordemParaProcessar.querySelector('input.selecionado[id]').id;
        console.log(`%c[PROCESSANDO] O.S. ID: ${idDaOS}`, "color: orange; font-weight: bold;");

        try {
            // --- Bloco de Ações na Página Principal ---
            // Simula os cliques para abrir o menu de opções e, em seguida, o formulário modal.
            ordemParaProcessar.querySelector('a[data-toggle="dropdown"]').click();
            await new Promise(resolve => setTimeout(resolve, 200)); // Pausa para o menu aparecer.
            ordemParaProcessar.querySelector(`a[id="aceitar|${idDaOS}"]`).click();

            // --- Bloco de Ações no Formulário (Modal) ---
            const form = await waitForElement('form[action*="aceitarSolicitacao"]');
            
            // Prepara a abertura da nova janela.
            const windowName = 'os_submission_' + idDaOS;
            const windowFeatures = 'width=800,height=600,scrollbars=yes,resizable=yes';
            
            // Abre a nova janela e guarda sua referência.
            const novaJanela = window.open('', windowName, windowFeatures);
            
            // Truque para abrir a janela em segundo plano, sem "roubar" o foco do usuário.
            if (novaJanela) {
                novaJanela.blur();
            }
            
            // Adiciona a referência da janela ao nosso gerenciador.
            janelasAbertasPeloScript.push(novaJanela);
            atualizarContadorDoBotao();
            
            // Direciona o resultado do formulário para a nova janela criada.
            form.target = windowName;

            // Preenche os campos do formulário.
            const select = await waitForElement("select[name^='preenchimentoPadrao_']", form);
            select.value = "Corretiva Planejada"; // O valor a ser inserido.
            select.dispatchEvent(new Event('change', { bubbles: true })); // Dispara o evento para o site reconhecer a mudança.
            
            const btnSalvar = Array.from(form.querySelectorAll('button')).find(btn => btn.innerText.trim() === 'Salvar');
            btnSalvar.onclick = () => true; // Sobrescreve o clique para pular a caixa de confirmação.
            btnSalvar.click();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa para o envio ser processado.

            // Usa a API do Bootstrap para fechar o modal, o método mais confiável.
            $('.modal.in').modal('hide');
            
            // --- Bloco de Finalização e Limpeza ---
            // Adiciona o ID à memória para não repetir esta O.S.
            osProcessadasNestaSessao.add(idDaOS);
            console.log(`   - O.S. ${idDaOS} adicionada à memória da sessão.`);
            
            // Pausa para a página se estabilizar antes de procurar o próximo item.
            console.log('   - Aguardando 2 segundos para estabilização...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verifica se atingiu o limite de janelas abertas para fazer a limpeza automática.
            if (janelasAbertasPeloScript.length >= 5) {
                fecharTodasAsJanelas();
                atualizarContadorDoBotao();
                console.log('   - Pausa adicional de 1,5 segundos após a limpeza das janelas.');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

        } catch (error) {
            // Em caso de qualquer erro, interrompe o script e tenta fechar as janelas abertas.
            console.error(`ERRO no processamento da OS ${idDaOS}:`, error);
            console.log("A automação será interrompida por segurança. Fechando todas as janelas...");
            fecharTodasAsJanelas();
            break; // Encerra o loop 'while'.
        }

        console.log(`%c[SUCESSO] OS ${idDaOS} processada. Procurando a próxima...`, "color: lightblue;");
    }
}

// Inicia todo o processo.
processarTodasAsOrdens();
