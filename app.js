import { supabase } from './supabaseClient.js'

const usuarioLogado = "Médico Plantonista"
document.getElementById('lblUser').textContent = `Usuário: ${usuarioLogado}`

const colunasTabela = [
    "Data Ent.", "Hora Ent.", "Início Transf.", "Chefe Equipe", "Residente", "Regulação",
    "Origem/Ala", "Leito Orig.", "Destino/Ala", "Leito Dest.", "Especialidade", "Prontuário",
    "Paciente", "Hora Avisado", "Enf. Ciente", "Checado Plant.", "Data Cheg.", "Hora Cheg.", "Status"
];

const botoesAba = document.querySelectorAll('.aba-btn')
const conteudosAba = document.querySelectorAll('.aba-conteudo')

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
        chefe_equipe: document.getElementById('txtChefe').value,
        residente: document.getElementById('txtResidente').value,
        regulacao: document.getElementById('txtRegulacao').value,
        origem_ala: document.getElementById('txtOrigem').value,
        leito_origem: document.getElementById('txtLeitoOrigem').value,
        destino_ala: document.getElementById('txtDestino').value,
        leito_destino: document.getElementById('txtLeitoDestino').value,
        especialidade: document.getElementById('txtEspecialidade').value,
        prontuario: document.getElementById('txtProntuario').value,
        paciente: document.getElementById('txtPaciente').value,
        hora_avisado: document.getElementById('txtHoraAvisado').value,
        enfermeiro_ciente: document.getElementById('txtEnfermeiro').value,
        checado_por_plantonista: document.getElementById('txtPlantonista').value,
        data_chegada_leito: document.getElementById('txtDataCheg').value,
        horario_chegada: document.getElementById('txtHorarioCheg').value,
        status: document.getElementById('cbStatus').value
    }

    const { error } = await supabase.from('transferencias').insert([dados])

    if (error) {
        alert(`Erro ao salvar no banco em nuvem: ${error.message}`)
    } else {
        alert("Nova transferência registrada com sucesso na nuvem!")
        document.getElementById('formTransferencia').reset()
    }
})

async function carregarDadosSupabase(statusFiltro, idTabela) {
    const tabela = document.getElementById(idTabela)
    const tbody = tabela.querySelector('tbody')
    const theadRow = tabela.querySelector('thead tr')

    theadRow.innerHTML = colunasTabela.map(col => `<th>${col}</th>`).join('')
    if (statusFiltro === 'PENDING') theadRow.innerHTML += '<th>Ações</th>';
    tbody.innerHTML = '<tr><td colspan="20">Carregando dados da nuvem...</td></tr>'

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
            const btnConcluir = document.createElement('button')
            btnConcluir.textContent = "Concluir"
            btnConcluir.className = "btn-concluir-tabela"
            btnConcluir.addEventListener('click', () => alterarStatusParaConcluido(item.prontuario))
            tdAcao.appendChild(btnConcluir)
            linha.appendChild(tdAcao)
        }

        tbody.appendChild(linha)
    })
}

async function alterarStatusParaConcluido(prontuarioAlvo) {
    if (!confirm("Deseja marcar esta transferência como concluída (COMPLETED)?")) return

    const { error } = await supabase
        .from('transferencias')
        .update({ status: 'COMPLETED' })
        .eq('prontuario', prontuarioAlvo)

    if (error) {
        alert(`Falha ao atualizar status: ${error.message}`)
    } else {
        alert("Status updated successfully on cloud!")
        carregarDadosSupabase('PENDING', 'tabelaPendentes')
    }
}
