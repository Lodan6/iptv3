# 🎬 IPTV Ultra Vision — Next.js + Supabase

Este projeto migra o site IPTV de um HTML estático com dados hardcoded para uma aplicação **Next.js 14** com banco de dados **Supabase**, pronta para deploy na **Vercel**.

---

## 📁 Estrutura do Projeto

```
iptv-nextjs/
├── app/
│   ├── api/
│   │   └── servidores/
│   │       └── route.js       ← API Route (server-side, credenciais seguras)
│   ├── globals.css
│   ├── layout.js
│   └── page.jsx               ← Página principal (cliente)
├── lib/
│   └── supabase.js            ← Clientes Supabase (server + client)
├── supabase/
│   └── migration.sql          ← SQL para criar tabela e inserir dados
├── .env.local.example         ← Modelo das variáveis de ambiente
├── next.config.js
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

---

## 🚀 Setup Passo a Passo

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** e cole o conteúdo de `supabase/migration.sql`
3. Clique em **Run** — isso criará a tabela e inserirá todos os 42 servidores

### 2. Pegar as credenciais do Supabase

No painel do Supabase, vá em **Settings → API** e copie:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** (secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.local.example .env.local

# Edite com suas credenciais reais
```

Conteúdo do `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 4. Instalar e rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

### 5. Deploy na Vercel

1. Suba o projeto para um repositório no GitHub
2. Na Vercel, clique em **Import Project**
3. Em **Environment Variables**, adicione as 3 variáveis do `.env.local`
4. Clique em **Deploy** ✅

---

## 🔒 Segurança — Por que esse modelo é mais seguro?

```
ANTES (HTML estático):
  Browser → dados dos servidores expostos no código-fonte ❌

AGORA (Next.js + Supabase):
  Browser → /api/servidores (Next.js Route) → Supabase → retorna dados ✅
```

- A `SUPABASE_SERVICE_ROLE_KEY` **nunca** chega ao browser
- A tabela tem **Row Level Security (RLS)** ativa
- A política de leitura é pública (qualquer um pode ver), mas escrita só via service role
- Os dados de usuário/senha dos servidores IPTV ficam no banco, não no código

---

## ➕ Adicionar/Remover Servidores

Sem precisar tocar no código:

**Via Supabase Dashboard (Table Editor):**
```sql
-- Adicionar
INSERT INTO servidores (url, usuario, senha) VALUES ('http://novo.server.com:80', 'user', 'pass');

-- Remover (soft delete)
UPDATE servidores SET ativo = false WHERE id = 5;

-- Remover definitivo
DELETE FROM servidores WHERE id = 5;
```

Usuários ainda podem adicionar servidores manualmente pelo site (salvos no `localStorage` do browser deles).

---

## 🗄️ Estrutura da Tabela `servidores`

| Coluna      | Tipo        | Descrição                        |
|-------------|-------------|----------------------------------|
| `id`        | BIGSERIAL   | Chave primária auto-incremental  |
| `nome`      | TEXT        | Nome amigável (opcional)         |
| `url`       | TEXT        | URL do servidor IPTV             |
| `usuario`   | TEXT        | Usuário de acesso                |
| `senha`     | TEXT        | Senha de acesso                  |
| `ativo`     | BOOLEAN     | Se `false`, não aparece no site  |
| `criado_em` | TIMESTAMPTZ | Data de criação (automático)     |
