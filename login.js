import { supabase } from './supabaseClient.js'

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('txtEmail').value
    const senha = document.getElementById('txtSenha').value
    const msgErro = document.getElementById('msgErro')

    msgErro.textContent = "" // Limpa erros antigos

    // Tenta fazer o login no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
    })

    if (error) {
        msgErro.textContent = `Falha no login: ${error.message}`
    } else {
        // Se der certo, redireciona para a tela do painel hospitalar
        window.location.href = './painel.html'
    }
})