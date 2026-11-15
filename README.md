# Instagram Explorer & Downloader (Vercel + Firebase)

Aplicação web completa construída com Next.js (App Router), Tailwind CSS, Firebase (Client & Admin SDK) e pronta para deploy na **Vercel**.

---

## 🛠️ Tecnologias Integradas

- **Frontend:** Next.js 14, Tailwind CSS, Lucide React (Dark Mode nativo).
- **Backend / Edge:** Next.js Route Handlers com streaming proxy (Anti-CORS) e runtime compatível com Serverless Functions da Vercel.
- **Firebase:**
  - `firebase`: SDK Client configurado para Web/SPA.
  - `firebase-admin`: SDK Server-Side para persistência de buscas e métricas de download no Firestore.
- **Vercel:** Arquivo `vercel.json` e otimizações de `maxDuration` para streaming de arquivos pesados.

---

## 📋 Como Configurar e Rodar Localmente

### 1. Instalar as Dependências
```bash
npm install
```

### 2. Variáveis de Ambiente
Copie o arquivo de exemplo para `.env.local`:
```bash
cp .env.example .env.local
```
*(No Windows PowerShell: `Copy-Item .env.example .env.local`)*

> **Nota:** Se você não configurar nenhuma variável de ambiente, o sistema funcionará automaticamente no **Modo Demonstrativo**, permitindo testar a interface, busca simulada e downloads imediatos sem erros.

### 3. Rodar o Servidor
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

---

## 🚀 Como Fazer Deploy na Vercel

1. Suba o projeto para um repositório no **GitHub**, **GitLab** ou **Bitbucket**.
2. Conecte sua conta na [Vercel](https://vercel.com) e importe o repositório.
3. No painel de importação da Vercel, abra a aba **Environment Variables** e adicione as variáveis presentes no seu `.env.example`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `INSTAGRAM_API_KEY` (opcional, para dados reais)
4. Clique em **Deploy**. A Vercel detectará automaticamente o framework Next.js e criará as Serverless Functions com suporte a streaming de downloads.
