# PRANKID

Site da toy art PRANKID: vitrine + carrinho + checkout Yampi + painel em `/panel`.

## Estrutura

- `front` — Next.js (loja e painel)
- `back` — Express + Prisma + Postgres

## Desenvolvimento local

No `back`:

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

No `front`:

```bash
cp .env.example .env.local
npm install
npm run dev
```

- Loja: http://localhost:3000
- Painel: http://localhost:3000/panel
- API: http://localhost:4000/health

Login inicial (se não alterar as envs): `admin@prankid.com` / `altere-esta-senha`.

`ADMIN_EMAIL` e `ADMIN_PASSWORD` são aplicados **a cada subida** da API (não só na primeira vez). Depois de mudar essas variáveis no EasyPanel, reinicie o serviço do back para o painel aceitar os novos dados.

## Yampi

1. No painel da Yampi, abra o produto e copie o **link de compra** (`https://seguro.seudominio.com.br/r/AABBJJ`).
2. Em `/panel/config`, cole a URL base: `https://seguro.seudominio.com.br`.
3. Em cada produto, cole só o token (`AABBJJ`).
4. O botão **Finalizar compra** monta `.../r/TOKEN1:QTD1,TOKEN2:QTD2`.

## EasyPanel

Crie **dois App services** no mesmo repositório, branch `main`.

### back

- Build path: `back`
- Porta: `4000`
- Volume persistente: `/app/uploads`
- Variáveis:
  - `DATABASE_URL` — cole **sem aspas**, com nome do banco depois da porta:
    `postgresql://USER:SENHA@HOST:PORTA/BANCO?sslmode=disable`
    (se colar `"postgresql://..."` o Prisma quebra com P1013 / porta inválida)
  - `JWT_SECRET`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
    (o login do painel vem dessas variáveis; depois de alterar, **reinicie o back**)
  - `CORS_ORIGIN` (domínio público do front, com `https://`)
  - `COOKIE_SECURE=true`
  - `PORT=4000`

### front

- Build path: `front`
- Porta: `3000`
- Variável de **runtime** (não precisa ser build arg): `API_URL` = URL pública da API
  (`https://gerenciamento-prankid-back....easypanel.host`)

O browser fala só com o domínio do front. O Next.js encaminha `/api` e `/uploads` para o back.

Não versione o `DATABASE_URL` com senha. Configure só no EasyPanel.
