import { supabase } from './supabaseClient.js'

document.getElementById('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('txtEmailCadastro').value.trim();
    const senha = document.getElementById('txtSenhaCadastro').value;
    const msgFeedback = document.getElementById('msgErroCadastro');

    // Limpa mensagens anteriores
    msgFeedback.textContent = "";
    msgFeedback.style.color = "#e74c3c"; // Vermelho padrão de erro

    // Mostra um estado de carregando no botão
    const btnSubmit = document.getElementById('btnEntrar');
    const textoOriginalBotao = btnSubmit.textContent;
    btnSubmit.textContent = "Processando registro...";
    btnSubmit.disabled = true;

    // Executa a criação do usuário no módulo de autenticação do Supabase
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: senha
    });

    // Restaura o botão
    btnSubmit.textContent = textoOriginalBotao;
    btnSubmit.disabled = false;

    if (error) {
        // Exibe o erro retornado pelo banco (Ex: e-mail duplicado, senha fraca)
        msgFeedback.style.color = "#e74c3c";
        msgFeedback.textContent = `Erro no cadastro: ${error.message}`;
    } else {
        // Sucesso! Dependendo da configuração do seu Supabase, pode exigir confirmação por e-mail
        msgFeedback.style.color = "#2ecc71"; // Verde de sucesso
        msgFeedback.textContent = "Cadastro realizado com sucesso! Verifique seu e-mail ou faça o login.";
        
        // Limpa o formulário
        document.getElementById('formCadastro').reset();

        // Opcional: Redireciona o usuário para a tela de login após 3 segundos
        setTimeout(() => {
            window.location.href = './index.html';
        }, 3000);
    }
});
