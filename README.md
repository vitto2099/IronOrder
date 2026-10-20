# 🍽️ QR Order - Sistema de Cardápio e Pedidos por QR Code

Bem-vindo ao **QR Order**! Este projeto é uma plataforma completa para restaurantes e clientes: os clientes visualizam o cardápio e fazem pedidos através de QR Code na mesa, e a equipe (atendimento, cozinha, gerência e caixa) gerencia as comandas e mesas em tempo real.

---

## 📌 AVISO IMPORTANTE: Antes de Começar (Para quem não é programador)

Para este projeto funcionar no seu computador, você precisa ter instalado um programa gratuito chamado **Node.js**.

### O que é o Node.js?
Pense no **Node.js** como o "motor" do aplicativo. Assim como um carro precisa de motor para andar, este projeto precisa do Node.js instalado para conseguir funcionar no seu computador. Ele é seguro, gratuito e amplamente utilizado no mundo inteiro.

### Como instalar o Node.js (Passo a Passo Simples):
1. Acesse o site oficial: [https://nodejs.org/](https://nodejs.org/)
2. Na página inicial, clique no botão verde de download da versão mais recente recomendada (**LTS** ou versão **24** ou superior).
3. Abra o instalador baixado (arquivo `.msi` no Windows ou `.pkg` no Mac).
4. Clique em **"Avançar" / "Next"** em todas as telas, aceite os termos e finalize a instalação.
5. Pronto! O Node.js já estará pronto no seu computador.

---

## 🚀 Como Rodar o Projeto

Siga os passos abaixo na ordem:

### 1. Descompactar o arquivo ZIP
- Clique com o botão direito no arquivo `.zip` recebido e selecione **"Extrair tudo..."** (ou use o descompactador de sua preferência).
- Abra a pasta que foi descompactada.

---

### 2. Abrir o Terminal / Prompt de Comando na pasta do projeto

- **No Windows:**
  - Abra a pasta do projeto no Explorador de Arquivos.
  - Clique na barra de endereço no topo da pasta (onde mostra o caminho dos arquivos).
  - Digite `cmd` (ou `powershell`) e aperte a tecla **Enter**.
  - Uma janela preta ou azul vai se abrir já na pasta do projeto.

- **No macOS / Linux:**
  - Abra o aplicativo **Terminal**.
  - Digite `cd ` (com um espaço depois) e arraste a pasta do projeto de dentro do Finder para a janela do Terminal, depois aperte **Enter**.

---

### 3. Preparar o arquivo de configuração (.env)

O sistema precisa de um arquivo de configuração básico.
- Se já existir o arquivo chamado `.env` na pasta, pode pular esta etapa!
- Se não existir, copie o arquivo `.env.example` e mude o nome da cópia para `.env`.
  - No terminal, você pode simplesmente digitar:
    - **Windows (PowerShell):** `copy .env.example .env`
    - **Mac / Linux:** `cp .env.example .env`

---

### 4. Instalar as dependências do projeto

No terminal aberto na pasta do projeto, digite o comando abaixo e aperte **Enter**:

```bash
npm install
```

> ⏳ *Isso pode demorar de 1 a 3 minutos dependendo da sua internet. Ele está baixando os complementos necessários para o sistema funcionar.*

---

### 5. Criar o Banco de Dados e Dados Iniciais de Teste

Para criar as tabelas do sistema e já incluir dados prontos de exemplo (cardápio com pratos, bebidas, mesas e usuários), digite no terminal:

```bash
node ace migration:run --seed
```

> Aperte **Enter** e aguarde a mensagem de confirmação (leva apenas alguns segundos).

---

### 6. Iniciar o Sistema

Agora, para colocar o sistema no ar, digite:

```bash
npm run dev
```

Você verá mensagens indicando que o servidor está funcionando e pronto para receber acessos.

---

## 🌐 Como Acessar o Sistema

Abra seu navegador de internet (Chrome, Edge, Firefox, Safari) e acesse:

👉 **[http://localhost:3333](http://localhost:3333)**

---

## 🔑 Contas de Teste Pré-cadastradas

Para você testar as diferentes funções do sistema, já deixamos usuários prontos:

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| **Administrador** | `admin@qrorder.local` | `admin123456` |
| **Gerente** | `gerente@qrorder.local` | `gerente123` |
| **Garçom** | `garcom@qrorder.local` | `garcom123` |
| **Cozinha** | `cozinha@qrorder.local` | `cozinha123` |
| **Caixa** | `caixa@qrorder.local` | `caixa123` |

---

## 💡 Dúvidas Frequentes

- **Como desligar/fechar o sistema?**  
  Na janela do terminal onde o projeto está rodando, aperte as teclas `Ctrl + C`. Isso encerra o sistema com segurança.

- **Como ligar novamente outro dia?**  
  Basta abrir o terminal na pasta do projeto e executar apenas:
  ```bash
  npm run dev
  ```
  *(Não precisa rodar `npm install` nem o comando de banco de dados novamente).*

- **Apareceu algum erro sobre "node não é reconhecido como comando"?**  
  Isso significa que o Node.js foi instalado enquanto o terminal estava aberto. Feche a janela do terminal, abra-a novamente e tente de novo.
