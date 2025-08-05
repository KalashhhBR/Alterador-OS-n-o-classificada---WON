(function() {
    if (document.getElementById('botao-fechar-janelas')) {
        console.log("O script de automação já foi injetado nesta página.");
        return;
    }
    const janelasAbertasPeloScript = [];
    function fecharTodasAsJanelas() {
        console.log(`%cFechando ${janelasAbertasPeloScript.length} janelas...`, 'color: #e67e22; font-weight: bold;');
        let fechadas = 0;
        janelasAbertasPeloScript.forEach(janela => {
            if (janela && !janela.closed) {
                janela.close();
                fechadas++;
            }
        });
        console.log(`%c${fechadas} janelas foram fechadas.`, 'color: #e67e22;');
        janelasAbertasPeloScript.length = 0;
        atualizarContadorDoBotao();
    }
    function criarBotaoDeFechamento() {
        const botao = document.createElement('button');
        botao.id = 'botao-fechar-janelas';
        botao.innerHTML = '❌ Fechar Janelas Abertas (0)';
        Object.assign(botao.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000',
            padding: '12px 20px', backgroundColor: '#dc3545', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '16px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
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
    async function processarTodasAsOrdens() {
        const opcoesDeClassificacao = {
            '1': 'Corretiva Planejada', '2': 'Corretiva', '3': 'Melhoria',
            '4': 'Acompanhamento', '5': 'Atendimento'
        };
        let textoPrompt = "Por favor, escolha a classificação de O.S. a ser aplicada:\n\n";
        for (const key in opcoesDeClassificacao) {
            textoPrompt += `${key} - ${opcoesDeClassificacao[key]}\n`;
        }
        textoPrompt += "\nDigite o número da opção desejada:";
        const escolhaUsuario = prompt(textoPrompt);
        if (escolhaUsuario === null) {
            console.log("❌ Operação cancelada pelo usuário.");
            return;
        }
        const classificacaoEscolhida = opcoesDeClassificacao[escolhaUsuario.trim()];
        if (!classificacaoEscolhida) {
            alert(`Opção inválida: "${escolhaUsuario}". O script não será executado.`);
            console.error(`❌ Opção inválida: "${escolhaUsuario}".`);
            return;
        }
        console.log(`🚀 INICIANDO AUTOMAÇÃO COM A CLASSIFICAÇÃO: "${classificacaoEscolhida}" 🚀`);
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
                return !ordem.innerText.includes("Classificação de O.S.") && !osProcessadasNestaSessao.has(idDaOS);
            });
            if (!ordemParaProcessar) {
                console.log("%c🎉 Trabalho concluído! Limpando janelas finais...", "color: green; font-size: 16px; font-weight: bold;");
                fecharTodasAsJanelas();
                break;
            }
            const idDaOS = ordemParaProcessar.querySelector('input.selecionado[id]').id;
            console.log(`%c[PROCESSANDO] O.S. ID: ${idDaOS}`, "color: orange; font-weight: bold;");
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
                select.value = classificacaoEscolhida;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`   - Classificação selecionada: "${classificacaoEscolhida}"`);

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
                console.log("A automação será interrompida por segurança. Fechando todas as janelas...");
                fecharTodasAsJanelas();
                break;
            }
            console.log(`%c[SUCESSO] OS ${idDaOS} processada. Procurando a próxima...`, "color: lightblue;");
        }
    }
    processarTodasAsOrdens();
})();
