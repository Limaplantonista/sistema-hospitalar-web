import { supabase } from './supabaseClient.js'

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
    // Se o médico tentar burlar a URL ou não tiver logado, expulsa para o login
    window.location.href = './index.html';
} else {
    // Se estiver logado, exibe o e-mail real dele na barra do hospital
    document.getElementById('lblUser').textContent = `Usuário: ${session.user.email}`;
}

// Configura o botão Sair que já existe no seu HTML
document.getElementById('btnSair').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = './index.html';
});

// --- 🩺 MÁSCARAS DE PADRONIZAÇÃO DE DATA E HORA (SEM PREENCHIMENTO AUTOMÁTICO) ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Aplicar Máscara de Data (DD/MM/AAAA) nos campos correspondentes
    const camposData = ['txtDataEnt', 'txtIniTrans', 'txtDataCheg'];
    camposData.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.setAttribute('maxlength', '10'); // Limita o tamanho máximo do campo
            input.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
                if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
                if (v.length > 5) v = v.substring(0, 5) + '/' + v.substring(5, 9);
                e.target.value = v;
            });
        }
    });

    // 2. Aplicar Máscara de Hora (HH:MM) nos campos correspondentes
    const camposHora = ['txtHoraEnt', 'txtHoraAvisado', 'txtHorarioCheg'];
    camposHora.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.setAttribute('maxlength', '5'); // Limita o tamanho máximo do campo
            input.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
                if (v.length > 2) v = v.substring(0, 2) + ':' + v.substring(2, 4);
                e.target.value = v;
            });
        }
    });
    // ADICIONADO AQUI: Ativa o monitoramento do campo de especialidade
    escutarMudancaEspecialidade();
});

const colunasTabela = [
    "Data Ent.", "Hora Ent.", "Início Transf.", "Chefe Equipe", "Residente", "Regulação",
    "Origem/Ala", "Leito Orig.", "Destino/Ala", "Leito Dest.", "Especialidade", "Prontuário",
    "Paciente", "Hora Avisado", "Enf. Ciente", "Checado Plant.", "Data Cheg.", "Hora Cheg.", "Status"
];

const botoesAba = document.querySelectorAll('.aba-btn')
const conteudosAba = document.querySelectorAll('.aba-conteudo')

// --- 🗂️ CONTROLADOR DE ABAS PRINCIPAIS (MÓDULOS DO HOSPITAL) ---
const botoesPrincipal = document.querySelectorAll('.aba-principal-btn');
const conteudosPrincipal = document.querySelectorAll('.aba-principal-conteudo');

botoesPrincipal.forEach(botao => {
    botao.addEventListener('click', () => {
        botoesPrincipal.forEach(b => b.classList.remove('ativa'));
        conteudosPrincipal.forEach(c => c.classList.remove('ativa'));

        botao.classList.add('ativa');
        const alvo = document.getElementById(botao.dataset.abaPrincipal);
        if (alvo) {
            alvo.classList.add('ativa');
            
            // TRUQUE DE CARREGAMENTO AUTOMÁTICO:
            // Se o médico clicar na aba principal de Prescritores, 
            // já carrega a primeira sub-aba (CME) automaticamente
            if (botao.dataset.abaPrincipal === 'bloco-prescritores') {
                carregarPrescritoresDoForm('CME', 'tabelaExpansao');
            }
        }
    });
});


botoesAba.forEach(botao => {
    botao.addEventListener('click', () => {
        botoesAba.forEach(b => b.classList.remove('ativa'))
        conteudosAba.forEach(c => c.classList.remove('ativa'))

        botao.classList.add('ativa')
        const abaAlvo = document.getElementById(botao.dataset.aba)
        abaAlvo.classList.add('ativa')

        if (botao.dataset.aba === 'pendentes') carregarDadosSupabase('PENDING', 'tabelaPendentes')
        if (botao.dataset.aba === 'concluidas') carregarDadosSupabase('COMPLETED', 'tabelaConcluidas')
    })
})

document.getElementById('formTransferencia').addEventListener('submit', async (e) => {
    e.preventDefault()

        const dados = {
        data_entrada_emergencia: document.getElementById('txtDataEnt').value,
        hora_entrada_emergencia: document.getElementById('txtHoraEnt').value,
        inicio_transferencia: document.getElementById('txtIniTrans').value,
        // MODIFICADO: Salva em letras maiúsculas
        chefe_equipe: document.getElementById('txtChefe').value.trim().toUpperCase(),
        residente: document.getElementById('txtResidente').value.trim().toUpperCase(),
        regulacao: document.getElementById('txtRegulacao').value,
        origem_ala: document.getElementById('txtOrigem').value,
        leito_origem: document.getElementById('txtLeitoOrigem').value,
        destino_ala: document.getElementById('txtDestino').value,
        leito_destino: document.getElementById('txtLeitoDestino').value,
        especialidade: document.getElementById('txtEspecialidade').value,
        prontuario: document.getElementById('txtProntuario').value,
        // MODIFICADO: Salva em letras maiúsculas
        paciente: document.getElementById('txtPaciente').value.trim().toUpperCase(),
        hora_avisado: document.getElementById('txtHoraAvisado').value,
        enfermeiro_ciente: document.getElementById('txtEnfermeiro').value.trim().toUpperCase(),
        checado_por_plantonista: document.getElementById('txtPlantonista').value.trim().toUpperCase(),
        data_chegada_leito: document.getElementById('txtDataCheg').value,
        horario_chegada: document.getElementById('txtHorarioCheg').value,
        status: document.getElementById('cbStatus').value
    }


        const btnSalvar = document.getElementById('btnSalvar');
    let respostaBanco;

    // Verifica se o formulário está no modo edição
    if (btnSalvar && btnSalvar.dataset.modo === "edicao") {
        const idExclusivo = btnSalvar.dataset.idTransferencia;

        // Atualiza apenas a linha correspondente ao ID único gerado pelo Supabase
        respostaBanco = await supabase
            .from('transferencias')
            .update(dados)
            .eq('id', idExclusivo);
    } else {
        // Caso contrário, realiza uma nova inserção padrão
        respostaBanco = await supabase
            .from('transferencias')
            .insert([dados]);
    }

    const { error } = respostaBanco;

    if (error) {
        alert(`Erro ao salvar no banco em nuvem: ${error.message}`)
    } else {
        alert("Transferência salva/atualizada com sucesso na nuvem!");
        document.getElementById('formTransferencia').reset();
        
        // Restaura as propriedades originais do botão de salvar (Modo Inserção)
        if (btnSalvar) {
            btnSalvar.textContent = "Salvar Transferência";
            btnSalvar.removeAttribute('data-modo');
            btnSalvar.removeAttribute('data-id-transferencia');
            btnSalvar.style.backgroundColor = "#2ecc71"; // Retorna para a cor verde padrão
        }

        // Atualiza a tabela visível de pendentes na hora
        carregarDadosSupabase('PENDING', 'tabelaPendentes');
        
        const containerLista = document.getElementById('container-lista-especialidade');
        if (containerLista) containerLista.style.display = 'none';
    }

})

async function carregarDadosSupabase(statusFiltro, idTabela) {
    const tabela = document.getElementById(idTabela)
    if (!tabela) return; // Proteção caso a tabela não exista na aba atual

    const tbody = tabela.querySelector('tbody')
    const theadRow = tabela.querySelector('thead tr')

    theadRow.innerHTML = colunasTabela.map(col => `<th>${col}</th>`).join('')
    if (statusFiltro === 'PENDING') theadRow.innerHTML += '<th>Ações</th>';
    tbody.innerHTML = '<tr><td colspan="20">Carregando dados da nuvem...</td></tr>'

    // --- 📝 ADICIONADO AQUI: FUNÇÃO DE PREENCHIMENTO DO FORMULÁRIO (ARROW FUNCTION ANTES DO USO) ---
    const carregarDadosParaEdicao = (item) => {
        console.log("Botão Editar clicado para o paciente:", item.paciente);

        // Função interna de segurança para preencher os campos apenas se existirem
        const preencherSeExistir = (id, valor) => {
            const campo = document.getElementById(id);
            if (campo) {
                campo.value = valor || '';
            } else {
                console.warn(`Aviso: O campo com ID '${id}' não foi encontrado no HTML.`);
            }
        };

        // Injeta os dados da nuvem de volta nas caixas de entrada de forma segura
        preencherSeExistir('txtDataEnt', item.data_entrada_emergencia);
        preencherSeExistir('txtHoraEnt', item.hora_entrada_emergencia);
        preencherSeExistir('txtIniTrans', item.inicio_transferencia);
        preencherSeExistir('txtChefe', item.chefe_equipe);
        preencherSeExistir('txtResidente', item.residente);
        preencherSeExistir('txtRegulacao', item.regulacao);
        preencherSeExistir('txtOrigem', item.origem_ala);
        preencherSeExistir('txtLeitoOrigem', item.leito_origem);
        preencherSeExistir('txtDestino', item.destino_ala);
        preencherSeExistir('txtLeitoDestino', item.leito_destino);
        preencherSeExistir('txtEspecialidade', item.especialidade);
        preencherSeExistir('txtProntuario', item.prontuario);
        preencherSeExistir('txtPaciente', item.paciente);
        preencherSeExistir('txtHoraAvisado', item.hora_avisado);
        preencherSeExistir('txtEnfermeiro', item.enfermeiro_ciente);
        preencherSeExistir('txtPlantonista', item.checado_por_plantonista);
        preencherSeExistir('txtDataCheg', item.data_chegada_leito);
        preencherSeExistir('txtHorarioCheg', item.horario_chegada);
        preencherSeExistir('cbStatus', item.status || 'PENDING');

        // Transforma visualmente o botão salvar para o modo atualização
        const btnSalvar = document.getElementById('btnSalvar');
        if (btnSalvar) {
            btnSalvar.textContent = "Atualizar Transferência";
            btnSalvar.dataset.modo = "edicao";
            btnSalvar.dataset.idTransferencia = item.id; // Guarda o ID único da linha
            btnSalvar.style.backgroundColor = "#e67e22"; // Altera para cor laranja
        }

        // Simula o clique para abrir a aba do formulário automaticamente
        const botaoAbaForm = document.querySelector('[data-aba="nova-transferencia"]') || 
                             document.querySelector('[data-aba="form-aba"]') ||
                             document.querySelector('.aba-btn');
                             
        if (botaoAbaForm) {
            botaoAbaForm.click();
        }
    };

    // Chamada de busca ao Supabase
    const { data, error } = await supabase
        .from('transferencias')
        .select('*')
        .eq('status', statusFiltro)

    if (error) {
        tbody.innerHTML = `<tr><td colspan="20">Erro ao buscar dados: ${error.message}</td></tr>`
        return
    }

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="20">Nenhum registro encontrado.</td></tr>`
        return
    }

    tbody.innerHTML = ''
    data.forEach(item => {
        const linha = document.createElement('tr')
        linha.innerHTML = `
            <td>${item.data_entrada_emergencia || ''}</td>
            <td>${item.hora_entrada_emergencia || ''}</td>
            <td>${item.inicio_transferencia || ''}</td>
            <td>${item.chefe_equipe || ''}</td>
            <td>${item.residente || ''}</td>
            <td>${item.regulacao || ''}</td>
            <td>${item.origem_ala || ''}</td>
            <td>${item.leito_origem || ''}</td>
            <td>${item.destino_ala || ''}</td>
            <td>${item.leito_destino || ''}</td>
            <td>${item.especialidade || ''}</td>
            <td>${item.prontuario || ''}</td>
            <td><strong>${item.paciente || ''}</strong></td>
            <td>${item.hora_avisado || ''}</td>
            <td>${item.enfermeiro_ciente || ''}</td>
            <td>${item.checado_por_plantonista || ''}</td>
            <td>${item.data_chegada_leito || ''}</td>
            <td>${item.horario_chegada || ''}</td>
            <td><span class="badge ${item.status.toLowerCase()}">${item.status}</span></td>
        `
        
        if (statusFiltro === 'PENDING') {
            const tdAcao = document.createElement('td')
            
            // 1. Botão Concluir
            const btnConcluir = document.createElement('button')
            btnConcluir.textContent = "Concluir"
            btnConcluir.className = "btn-concluir-tabela"
            btnConcluir.style.marginRight = "5px"
            btnConcluir.addEventListener('click', () => alterarStatusParaConcluido(item.id))
            tdAcao.appendChild(btnConcluir)

            // 2. Botão Editar (Agora encontra a função declarada perfeitamente acima)
            const btnEditar = document.createElement('button')
            btnEditar.textContent = "Editar"
            btnEditar.className = "btn-concluir-tabela"
            btnEditar.style.backgroundColor = "#f39c12"
            btnEditar.addEventListener('click', () => carregarDadosParaEdicao(item))
            tdAcao.appendChild(btnEditar)

            linha.appendChild(tdAcao)
        }

        tbody.appendChild(linha)
    })
}

async function alterarStatusParaConcluido(idAlvo) {
    if (!confirm("Deseja marcar esta transferência como concluída (COMPLETED)?")) return

    const { error } = await supabase
        .from('transferencias')
        .update({ status: 'COMPLETED' })
        .eq('id', idAlvo) // Alterado de 'prontuario' para 'id'

    if (error) {
        alert(`Falha ao atualizar status: ${error.message}`)
    } else {
        alert("Status updated successfully on cloud!")
        carregarDadosSupabase('PENDING', 'tabelaPendentes')
    }
}

// --- 🔍 LISTAR PACIENTES DO SUPABASE POR ESPECIALIDADE EM TEMPO REAL ---
function escutarMudancaEspecialidade() {
    const campoEspecialidade = document.getElementById('txtEspecialidade');
    const containerLista = document.getElementById('container-lista-especialidade');
    const tituloLista = document.getElementById('titulo-lista-especialidade');
    const listaPacientes = document.getElementById('lista-pacientes-especialidade');

    if (!campoEspecialidade) return;

    campoEspecialidade.addEventListener('change', async (e) => {
        const espSelecionada = e.target.value;

        if (!espSelecionada) {
            if (containerLista) containerLista.style.display = 'none';
            return;
        }

        if (tituloLista) tituloLista.textContent = `Buscando pacientes de ${espSelecionada}...`;
        if (listaPacientes) listaPacientes.innerHTML = '<li style="padding: 5px 0; color: #666;">Carregando...</li>';
        if (containerLista) containerLista.style.display = 'block';

        const { data, error } = await supabase
            .from('transferencias')
            .select('paciente, leito_origem, destino_ala')
            .eq('especialidade', espSelecionada)
            .eq('status', 'PENDING');

        if (error) {
            if (listaPacientes) listaPacientes.innerHTML = `<li style="color: red;">Erro: ${error.message}</li>`;
            return;
        }

        if (!data || data.length === 0) {
            if (tituloLista) tituloLista.textContent = `Pacientes: ${espSelecionada}`;
            if (listaPacientes) listaPacientes.innerHTML = '<li style="padding: 8px 0; color: #888; font-style: italic;">Nenhum paciente pendente nesta especialidade.</li>';
            return;
        }

        if (tituloLista) tituloLista.textContent = `Pacientes em ${espSelecionada} (${data.length})`;
        if (listaPacientes) {
            listaPacientes.innerHTML = data.map(item => `
                <li style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">
                    <strong>📌 ${item.paciente}</strong> <br>
                    <small style="color: #666;">Origem: Leito ${item.leito_origem || 'N/I'} -> Destino: ${item.destino_ala || 'N/I'}</small>
                </li>
            `).join('');
        }
    });
}
// --- 📂 CONTROLADOR DE SUB-ABAS DOS PRESCRITORES ---
const botoesPrescritor = document.querySelectorAll('.aba-btn-prescritor');
const conteudosPrescritor = document.querySelectorAll('.aba-conteudo-presc');

botoesPrescritor.forEach(botao => {
    botao.addEventListener('click', () => {
        botoesPrescritor.forEach(b => b.classList.remove('ativa'));
        conteudosPrescritor.forEach(c => c.classList.remove('ativa'));

        botao.classList.add('ativa');
        const alvo = document.getElementById(botao.dataset.abaPresc);
        if (alvo) alvo.classList.add('ativa');

        // Dispara o filtro inteligente no Supabase baseado na especialidade selecionada
        if (botao.dataset.abaPresc === 'clinica-expansao') carregarPrescritoresDoForm('CME', 'tabelaExpansao');
        if (botao.dataset.abaPresc === 'prescritor-1andar') carregarPrescritoresDoForm('PRESCRITOR 1º ANDAR', 'tabela1Andar');
        if (botao.dataset.abaPresc === 'prescritor-3andar') carregarPrescritoresDoForm('PRESCRITOR 3º ANDAR', 'tabela3Andar');
        if (botao.dataset.abaPresc === 'clinica-extra') carregarPrescritoresDoForm('CLINICA MEDICA EXTRA', 'tabelaExtra');
    });
});

// --- 🔍 FUNÇÃO DE EXTRAÇÃO E FILTRAGEM POR ESPECIALIDADE NO SUPABASE ---
async function carregarPrescritoresDoForm(especialidadeFiltro, idTabela) {
    const tabela = document.getElementById(idTabela);
    if (!tabela) return;

    const tbody = tabela.querySelector('tbody');
    const theadRow = tabela.querySelector('thead tr');
    const colunasPrescritores = ["DATA", "REGULAÇÃO", "PACIENTE", "PRONTUARIO", "LEITO"];

    // Monta o cabeçalho de 5 colunas solicitado
    theadRow.innerHTML = colunasPrescritores.map(col => `<th>${col}</th>`).join('');
    tbody.innerHTML = '<tr><td colspan="5">Filtrando dados das transferências...</td></tr>';

    // Busca apenas as 5 informações necessárias na tabela existente do Supabase
       // MODIFICADO: Trocado 'origem_ala' por 'regulacao' na busca
    const { data, error } = await supabase
        .from('transferencias')
        .select('inicio_transferencia, regulacao, paciente, prontuario, leito_destino')
        .eq('especialidade', especialidadeFiltro);

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red;">Erro ao filtrar dados: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:#7f8c8d; font-style:italic;">Nenhum paciente pendente ou concluído nesta especialidade.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    data.forEach(item => {
        const linha = document.createElement('tr');
        // MODIFICADO: Trocado item.origem_ala por item.regulacao na segunda coluna
        linha.innerHTML = `
            <td>${item.inicio_transferencia || ''}</td>
            <td>${item.regulacao || ''}</td>
            <td><strong>${item.paciente || ''}</strong></td>
            <td>${item.prontuario || ''}</td>
            <td>${item.leito_destino || ''}</td>
        `;
        tbody.appendChild(linha);
    });

}

//================================================================================
// ABAS DO BLOCO ECTÓPICO (RESOLVIDO / NÃO RESOLVIDO) - FUNCIONAMENTO SIMPLES
//================================================================================

// 1. Seleciona todos os botões de aba do bloco ectópico
const botoesEctopico = document.querySelectorAll('.aba-btn-ectopico');
// 2. Seleciona todos os blocos de conteúdo relacionados
const conteudosEctopico = document.querySelectorAll('.aba-conteudo');

botoesEctopico.forEach(botao => {
    botao.addEventListener('click', () => {
        // --- PASSO 1: CONTROLAR OS BOTÕES ---
        // Remove a classe 'ativa' de todos os botões para apagar a linha verde deles
        botoesEctopico.forEach(b => b.classList.remove('ativa'));
        // Adiciona 'ativa' apenas no botão clicado (ele ganha a linha verde)
        botao.classList.add('ativa');

        // --- PASSO 2: CONTROLAR O CONTEÚDO ---
        // Esconde todos os blocos de conteúdo removendo a classe 'ativa'
        conteudosEctopico.forEach(conteudo => conteudo.classList.remove('ativa'));

        // Pega o ID da aba que queremos mostrar através do 'data-aba-ectopico'
        const idAbaAlvo = botao.getAttribute('data-aba-ectopico');
        
        // Encontra a div correspondente pelo ID (ex: #ectopico-resolvido) e mostra ela
        const abaAlvo = document.getElementById(idAbaAlvo);
        if (abaAlvo) {
            abaAlvo.classList.add('ativa');
        }
    });
});