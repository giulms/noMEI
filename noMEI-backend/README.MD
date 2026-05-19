# noMEI Backend

API REST do projeto noMEI, construída com **FastAPI** + **MongoDB Atlas**.

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- Acesso ao MongoDB Atlas do projeto (solicitar credenciais ao time)

---

## Configuração

### 1. Clone o repositório e acesse a pasta do backend

```bash
git clone https://github.com/Debburiti/noMEI.git
cd noMEI/noMEI-backend
```

### 2. Crie o arquivo `.env`

```bash
cp .env.example .env
```

Edite o `.env` com as credenciais do Atlas e uma chave secreta:

```env
# App
APP_ENV=development
APP_DEBUG=true
SECRET_KEY=gere-uma-chave-com-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database (MongoDB Atlas)
MONGODB_URL=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=pncp

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

> **Atenção:** o `MONGODB_DB_NAME` deve ser `pncp` — é o banco onde o ETL salva os dados.
> Se a senha contiver `@`, substitua por `%40` na URL.

Para gerar uma `SECRET_KEY` segura:
```bash
openssl rand -hex 32
```

---

## Rodando o projeto

### Com Docker (recomendado)

```bash
# Primeira vez ou após mudanças no código
docker compose up --build -d

# Subir sem rebuild
docker compose up -d

# Parar
docker compose down
```

### Sem Docker (requer uv instalado)

Se não tiver Docker, é possível rodar diretamente com [uv](https://docs.astral.sh/uv/):

```bash
# Instalar uv (caso não tenha)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Instalar dependências
uv sync

# Rodar a API com hot reload
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> Neste modo, o `MONGODB_URL` no `.env` precisa apontar para o Atlas — não há MongoDB local.

> A API ficará disponível em [http://localhost:8000](http://localhost:8000)

---

## Endpoints

### Públicos (sem autenticação)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/v1/auth/register` | Criar conta |
| `POST` | `/api/v1/auth/login` | Login — retorna access + refresh token |
| `POST` | `/api/v1/auth/refresh` | Renovar access token usando refresh token |
| `GET`  | `/api/v1/licitacoes/` | Listar contratações abertas (com filtros) |
| `GET`  | `/api/v1/licitacoes/{numeroControlePNCP}` | Detalhe de uma contratação |
| `GET`  | `/api/v1/estatisticas/` | Totais e distribuição por UF e modalidade |
| `GET`  | `/health` | Health check |

### Autenticados (requer `Authorization: Bearer <access_token>`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/v1/perfil/` | Criar ou atualizar perfil do MEI |
| `GET`  | `/api/v1/perfil/me` | Buscar próprio perfil |
| `POST` | `/api/v1/qualificacao/verificar` | Verificar elegibilidade para uma licitação |
| `POST` | `/api/v1/documentos/` | Upload de documento |
| `GET`  | `/api/v1/documentos/` | Listar documentos do MEI |
| `GET`  | `/api/v1/documentos/{id}/download` | Download de documento |
| `PATCH`| `/api/v1/documentos/{id}` | Atualizar status do documento |
| `DELETE`| `/api/v1/documentos/{id}` | Remover documento |

#### Filtros disponíveis em `GET /api/v1/licitacoes/`

| Parâmetro | Tipo | Exemplo |
|-----------|------|---------|
| `busca` | string | `?busca=limpeza` |
| `uf` | string | `?uf=SP` |
| `cnae` | string | `?cnae=4120-4/00` |
| `modalidadeId` | int | `?modalidadeId=6` |
| `valorMax` | float | `?valorMax=50000` |
| `meiCompativel` | bool | `?meiCompativel=true` |
| `page` | int | `?page=2` |
| `limit` | int | `?limit=20` |

---

## Autenticando no Swagger

1. Acesse [http://localhost:8000/docs](http://localhost:8000/docs)
2. Use `POST /api/v1/auth/register` para criar um usuário
3. Use `POST /api/v1/auth/login` e copie o `access_token`
4. Clique em **Authorize 🔒**, cole o token no campo `value` e clique em **Authorize**

---

## Estrutura do projeto

```
noMEI-backend/
├── app/
│   ├── api/v1/router.py        # Registro de todos os routers
│   ├── config.py               # Configurações via pydantic-settings
│   ├── main.py                 # Entrypoint, middleware, exception handlers
│   ├── core/
│   │   ├── database.py         # Conexão com MongoDB (Motor)
│   │   ├── dependencies.py     # get_current_user (JWT)
│   │   ├── exceptions.py       # Exceções customizadas
│   │   ├── middleware.py       # CORS, logging
│   │   └── security.py        # Hash de senha, JWT
│   └── domain/
│       ├── auth/               # Registro, login, refresh token
│       ├── perfil/             # Perfil do MEI (vinculado ao user_id)
│       ├── contratacoes/       # Contratações do PNCP
│       ├── documentos/         # Upload e gestão de documentos (GridFS)
│       ├── estatisticas/       # Totais e distribuições
│       ├── qualificacao/       # Checklist de elegibilidade por licitação
│       └── alertas/            # (Sprint 3)
├── tests/
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## Dependências principais

| Pacote | Uso |
|--------|-----|
| `fastapi` | Framework web |
| `uvicorn` | Servidor ASGI |
| `motor` | Driver async para MongoDB |
| `pydantic-settings` | Configurações via `.env` |
| `python-jose` | Geração e validação de JWT |
| `bcrypt` | Hash de senhas |
