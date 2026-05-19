# noMEI Front-end

Desenvolvido com **React Native + Expo**, responsável pela interface do usuário e consumo da API REST do backend.

## Requisitos

- Node.js 18+
- npm
- Expo CLI (ou uso via npx expo)
- Aplicativo Expo Go (para execução em dispositivo físico)
- Backend noMEI rodando localmente ou em ambiente remoto

## Configuração

### 1. Clone o repositório e acesse a pasta do front-end

```bash
git clone https://github.com/Debburiti/noMEI.git
cd noMEI/noMEI-frontend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Execute o projeto

```bash
npx expo start
```

## Integração com API

O front-end consome a API do noMEI Backend:

| Camada | Responsabilidade |
|-----------|-----|
| Front-end (React Native) | Interface do usuário |
| Services (Axios/fetch) | Comunicação HTTP |
| Backend (FastAPI) | Regras de negócio |
| MongoDB | Persistência de dados |

## Fluxo de dados

```
Usuário
  ↓
Interface (React Pages)
  ↓
Components
  ↓
Services (API layer)
  ↓
Backend (FastAPI)
  ↓
MongoDB
```

## Estrutura do projeto

```
front-end/
└── noMEI/
    ├── .expo/                # Configurações internas do Expo
    ├── assets/               # Imagens, ícones e splash screen
    ├── src/
    │   ├── components/       # Componentes reutilizáveis (botões, inputs, etc.)
    │   ├── context/          # Provedores de estado global (AuthContext, etc.)
    │   ├── hooks/            # Custom Hooks (useAuth, useFetch, etc.)
    │   ├── navigation/       # Configuração de rotas (Stack, Tab, Drawer)
    │   ├── screens/          # Telas da aplicação (Home, Login, Perfil)
    │   ├── services/         # Integração com API (Axios, Fetch)
    │   ├── theme/            # Definições de cores, fontes e estilos globais
    │   ├── types/            # Definições de tipos TypeScript/Interfaces
    │   ├── App.tsx           # Ponto de entrada principal do componente
    │   └── index.ts          # Arquivo de inicialização
    ├── app.json              # Configuração do manifesto do Expo
    ├── package.json          # Manifest do projeto e scripts
    ├── package-lock.json     # Bloqueio de versões das dependências
    └── tsconfig.json         # Configurações do TypeScript
```
