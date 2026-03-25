# Documento de Especificação de Requisitos (PRD) - App Gestão de Futebol

## 1. Visão Geral do Projeto
O objetivo deste projeto é criar um protótipo funcional de um aplicativo para gestão de jogos de futebol (Bagres FC). O sistema gerencia a confirmação de presença, pagamentos, sorteio de times, controle de tempo e placar das partidas, além de manter o histórico e estatísticas individuais dos jogadores.

### 1.1. Diretrizes Técnicas e de UX
* **Abordagem:** Mobile-first absoluto.
* **Navegação:** Aplicativo dividido em telas distintas (navegação por rotas/abas), não deve ser uma página única de rolagem infinita.
* **Foco:** Interface limpa, usabilidade focada em interações rápidas no celular (especialmente para o administrador na beira do campo).

---

## 2. Regras de Negócio e Perfis de Acesso

### 2.1. Perfis de Usuário
1. **Administrador:** Controle total do sistema, gestão de usuários, controle do fluxo da rodada e registro de métricas das partidas.
2. **Usuário Comum:** Jogador padrão que participa dos jogos, vota e visualiza estatísticas.
3. **Pendente:** Estado inicial de qualquer cadastro. **Regra de Ouro:** Nenhum usuário recém-cadastrado tem acesso às telas do sistema (além da Tela de Login/Cadastro). Eles verão apenas uma tela de bloqueio com a mensagem *"Aguardando aprovação"*. O acesso normal só ocorre após a liberação via Tela 6 pelo Administrador.

### 2.2. O Ciclo da Rodada (Timeline)
* **Segunda a Quinta (antes das 14:00):** Status "Aguardando rodada". O administrador tem a opção de abrir a lista manualmente.
* **Quinta-feira às 14:00:** A lista de presença é aberta automaticamente. **Regra:** Administradores cadastrados no sistema entram automaticamente como os primeiros da lista confirmada.
* **Quinta-feira às 18:00 (ou quando todos pagarem):** Encerramento da lista e exibição dos times sorteados.

---

## 3. Estrutura de Telas do Aplicativo

### Tela 1: Login / Cadastro
* **Objetivo:** Porta de entrada do app.
* **Funcionalidades:**
  * Formulário de Login.
  * Formulário de Criação de Conta.
  * Direcionamento inteligente: Avalia se o usuário é Admin, Usuário Aprovado ou Usuário Pendente.
  * Tela de bloqueio ("Aguardando aprovação") para contas não validadas.

### Tela 2: Perfis e Rodadas (Visão Geral)
* **Objetivo:** Hub de informações públicas e históricas.
* **Funcionalidades:**
  * Lista de todos os jogadores cadastrados e aprovados.
  * Exibição da nota/rating atual de cada jogador.
  * Histórico de rodadas passadas.
  * **Detalhes de cada rodada no histórico:** Exibição do Artilheiro, Garçom (líder de assistências) e o "Time da Rodada".

### Tela 3A: Administração da Rodada (Visão Exclusiva do Admin)
* **Objetivo:** Painel de controle para gerenciar o evento semanal e os jogos ao vivo.
* **Funcionalidades Pré-Jogo:**
  * Botão para iniciar a rodada manualmente (disponível a partir de segunda-feira).
  * Gestão da Lista: Remover nomes, visualizar quem marcou que pagou, validar o pagamento (se não pagou, devolve a cobrança ao usuário; se pagou, marca na lista visualmente).
  * Botão para **Sortear Times Manualmente**.
* **Funcionalidades Durante o Jogo:**
  * Botão "Iniciar Jogos".
  * Tela de Partida: Exibe os 4 times sorteados. O Admin seleciona o confronto atual.
  * Interface da Partida Ativa: Fotos dos jogadores, Cronômetro, botões para registrar Gols e Assistências para jogadores específicos.
  * Marcação do time vitorioso e botão "Finalizar Jogo" (zera o cronômetro e permite escolher o próximo confronto).
* **Funcionalidades Pós-Jogo:**
  * Botão "Finalizar Rodada" (encerra o evento e atualiza o banco de dados/estatísticas).
  * Geração do Resumo Oficial: Time da Rodada, Artilheiro e Garçom.

### Tela 3B: Rodada do Usuário (Visão do Jogador)
* **Objetivo:** Interação do jogador com o evento da semana.
* **Comportamento baseado na Timeline:**
  * **Antes de Quinta 14:00:** Exibe "Aguardando rodada".
  * **Quinta 14:00:** Lista liberada. Botão para "Entrar na lista".
  * **Se entrou na lista principal:** Exibe a lista completa, botão para "Confirmar Pagamento" ou "Retirar nome".
  * **Se caiu na lista de espera:** Exibe a lista completa e, no lugar do pagamento, mostra a *posição atual na fila*.
  * **Quinta 18:00 (ou todos pagos):** A tela muda e exibe os times sorteados.
  * **Fim da Rodada:** Exibe o resumo oficial (Time, Artilheiro, Garçom).

### Tela 4: Votação
* **Objetivo:** Sistema de avaliação para gerar as notas dos jogadores.
* **Funcionalidades:**
  * Interface para o usuário avaliar os colegas.
  * **Regra restrita:** Cada usuário só pode votar uma única vez por ciclo. Após o voto, a tela fica inacessível para ele.
  * O Administrador tem um gatilho para "Reabilitar Votação" quando necessário.

### Tela 5: Perfil
* **Objetivo:** Área pessoal do usuário.
* **Funcionalidades:**
  * Visualização de métricas próprias: Gols, Assistências, Jogos disputados, Times em que atuou.
  * Formulário para edição de dados pessoais e foto.

### Tela 6: Administração de Usuários (Visão Exclusiva do Admin)
* **Objetivo:** Backoffice de gestão de pessoas e acessos.
* **Funcionalidades:**
  * Lista de contas com status "Pendente" para Aprovar ou Rejeitar.
  * Criação manual de usuários ou administradores.
  * Edição e exclusão de contas existentes.