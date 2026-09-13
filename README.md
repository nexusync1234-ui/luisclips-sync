# 🎬 Luisclips — Batalha de Clippers do Luís Ferreira

Plataforma desenvolvida para analisar, classificar e exibir em direto na stream as contas de TikTok dos clippers dedicados ao streamer **Luís Ferreira**.

> *"Na última live de cada mês irei analisar EM LIVE as vossas contas de clipes. A que tiver mais views PAGO EM LIVE. E se a conta for realmente boa, eu CONTRATO ESSA PESSOA EM LIVE."*  
> — **Luís Ferreira**

---

## ✨ Funcionalidades Principais

* **🏆 Leaderboard & Pódio Animado:**
  * Pódio dinâmico dos 3 primeiros colocados com coroa dourada para o líder atual ("Candidato a Contratação").
  * Classificação ordenada por **Views do Mês Atual (Corrida da Live)** ou Histórico Geral.
  * Barras de progresso proporcionais ao 1º lugar.
* **⏱️ Contagem Regressiva para a Live:**
  * Relógio em tempo real calculando os dias, horas, minutos e segundos até a última live do mês.
* **🎥 Feed de Clipes Virais:**
  * Galeria com os cortes mais assistidos, capas dos vídeos, contadores de visualizações, curtidas e botão para assistir diretamente no TikTok.
* **📺 Modo Stream / Overlay OBS:**
  * Interface limpa, minimalista e de alto contraste pensada para o Luís Ferreira partilhar na tela da stream ou usar como fonte de navegador no OBS Studio.
* **⚡ Scraping Público Sem Login:**
  * Não exige que nenhum clipper faça login nem autorize permissões. Basta inserir o `@username` ou link do perfil que o motor recolhe seguidores, curtidas e os vídeos do mês.
* **🐘 Suporte a Neon PostgreSQL + Armazenamento Local:**
  * Totalmente integrado com **Prisma ORM** e **Neon (Serverless PostgreSQL)**.
  * Funciona imediatamente com armazenamento local persistente e sincroniza com a nuvem assim que a `DATABASE_URL` do Neon for inserida no `.env`.

---

## 🚀 Como Iniciar o Projeto

### Atualização automática das views

A página relê a base de dados a cada 30 segundos. A recolha de novas views exige o processo Python com `yt-dlp` e acesso ao TikTok.

No Windows, abra `iniciar_auto_sync_oculto.vbs`: inicia um processo em segundo plano que recolhe as métricas, aguarda cinco minutos e repete. A primeira recolha começa após cinco minutos. O computador tem de permanecer ligado e com Internet; volte a iniciar o processo após reiniciar o Windows. Os logs ficam em `.sync/output.log` e `.sync/error.log`. Use `parar_auto_sync.bat` para parar apenas este processo.

Para uma atualização imediata, execute `npm run sync`. Recolhas vazias ou inválidas preservam os dados e a data da última sincronização válida; o comando termina com erro se alguma conta falhar. São recolhidos até 50 vídeos recentes por conta, mantendo os clips anteriormente guardados. Os totais abrangem os clips monitorizados e não garantem a cobertura de todo o perfil.

O agendamento na nuvem está no repositório `nexusync1234-ui/luisclips-sync`, workflow `auto_sync.yml`, a cada dez minutos (minutos 03, 13, 23, 33, 43 e 53). Funciona com o PC desligado; o GitHub pode atrasar execuções. O extrator usa `curl_cffi` e `--impersonate chrome` também nos pedidos à API do TikTok. Em 7 de setembro de 2026, a execução `34123883560` atualizou 26 de 28 contas com o processo local parado; duas não devolveram vídeos e conservaram os dados. O workflow assinala erro quando alguma conta não pode ser verificada.

Para alterar o processo na nuvem, publique os scripts nesse repositório dedicado. As alterações neste checkout, por si só, não o atualizam. O processo local é apenas uma alternativa e deve ficar parado quando se usa a nuvem, para evitar recolhas concorrentes.

### 1. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev -- -p 3005
```
Aceda a `http://localhost:3005` no navegador.

### 2. Configurar a Base de Dados no Neon (Opcional)
1. Crie uma base de dados gratuita em [neon.tech](https://neon.tech).
2. Copie a sua connection string.
3. Abra o ficheiro `.env` e cole:
   ```env
   DATABASE_URL="postgresql://neondb_owner:SUA_SENHA@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```
4. Execute o comando para criar as tabelas no Neon:
   ```bash
   npx prisma db push
   ```

---

## 🔒 Proteção de Administrador

Apenas quem tiver a senha de administrador pode adicionar ou remover contas.
* **Senha padrão configurada:** `luisclips2026` (alterável em `.env`)
* **Como entrar:** Clique no botão `Admin 🔒` no cabeçalho e insira a senha.
* **Para visitantes normais:** Os botões de adicionar e apagar não aparecem e as rotas de API rejeitam requisições não autorizadas (401).

---

## 🌐 Como Publicar na Internet

A aplicação está pronta para ser publicada gratuitamente em plataformas como **Vercel**, **Railway** ou **Render**:

### Opção 1: Vercel (Recomendada)
1. Suba o projeto para o seu GitHub.
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Nas **Environment Variables** da Vercel, adicione:
   * `DATABASE_URL`: A sua URL do Neon (com pooling)
   * `DIRECT_URL`: A sua URL do Neon (direta)
   * `ADMIN_PASSWORD`: A sua senha de administrador secreta
4. Clique em **Deploy**!

---

## 👥 Contas Já Integradas Inicialmente

1. `@clipesptluisferreira`
2. `@clipsdoferreirinha`
3. `@clipsdoluisferreiraa`

Para adicionar novas contas, basta clicar no botão **"+ Adicionar Clipper"** na barra superior e colar o `@username`.

---

## 🛠️ Tecnologias Utilizadas

* **Next.js 15 (App Router)**
* **React 19**
* **Tailwind CSS**
* **Prisma ORM & Neon PostgreSQL**
* **Lucide Icons**
* **Python + yt-dlp** (Motor de extração de métricas públicas)
