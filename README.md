# noMEI

## Sobre o projeto

Microempreendedores Individuais têm direito legal a tratamento favorecido em licitações públicas, mas raramente conseguem competir na prática. A barreira não é jurídica — é operacional: editais dispersos, linguagem técnica inacessível e exigências documentais difíceis de acompanhar sem estrutura administrativa.

O noMEI é uma plataforma que centraliza oportunidades de licitação do governo federal, traduz os requisitos de cada edital para uma linguagem acessível e guia o MEI na organização dos documentos necessários para participar — reduzindo o esforço de entrada e aumentando as chances de uma proposta bem-sucedida.

---

## Funcionalidades

### Busca e filtragem de licitacoes
Listagem de contratações abertas extraídas diretamente do Portal Nacional de Contratações Públicas (PNCP), com filtros por estado, modalidade, valor máximo e compatibilidade com o limite de faturamento do MEI.

### Análise automática de requisitos
Checklist gerado automaticamente para cada licitação, verificando se o perfil do MEI (CNAE, UF, valor) atende aos critérios da contratação, com base na Lei 14.133/2021.

### Gestão de documentos
Upload e organização dos documentos necessários para participar de licitações, com controle de status (pendente, válido, expirado) e armazenamento seguro por CNPJ.

### Perfil do MEI
Cadastro do perfil com CNPJ, CNAE e localização, utilizado para personalizar as recomendações e o checklist de elegibilidade.

### Estatísticas
Visão consolidada das oportunidades disponíveis por estado e modalidade de contratação.

### Alertas e notificações (previsto)
Notificações automáticas sobre novos editais compatíveis com o perfil do MEI e avisos de prazo de encerramento de propostas.

### Histórico de participações (previsto)
Dashboard com o registro das licitações acompanhadas pelo MEI, permitindo visualizar o histórico de propostas submetidas e seus resultados.

---

## Arquitetura

O projeto é dividido em três camadas independentes:

```
noMEI/
├── etl-pipeline/       # Extração, transformação e carga de dados do PNCP
├── noMEI-backend/      # API REST (FastAPI + MongoDB Atlas)
└── front-end/          # Aplicativo mobile (React Native + Expo)
```

### Fluxo de dados

```
PNCP (API pública)
       |
       v
  etl-pipeline
  - Extrai contratações abertas via API REST do PNCP
  - Enriquece cada registro com códigos CNAE dos itens do edital
  - Computa flag _mei_compativel (valor <= R$ 144.900,00)
  - Cria índices de busca e filtro no MongoDB
       |
       v
  MongoDB Atlas (banco: pncp, coleção: contratacoes_proposta)
       |
       v
  noMEI-backend
  - Serve os dados via API REST com filtros, paginação e autenticação JWT
  - Gerencia usuários, perfis e documentos dos MEIs
  - Armazena arquivos via GridFS (coleção: documentos_mei)
       |
       v
  front-end (React Native)
  - Consome a API e apresenta as oportunidades ao usuário
```

### Banco de dados

| Coleção | Conteúdo |
|---------|----------|
| `contratacoes_proposta` | Contratações abertas extraídas do PNCP |
| `users` | Contas de usuário (email + senha hash) |
| `perfis_mei` | Perfil do MEI vinculado ao usuário |
| `documentos_mei.files` | Metadados dos arquivos enviados (GridFS) |
| `documentos_mei.chunks` | Conteúdo binário dos arquivos (GridFS) |

### ETL

O pipeline é executado manualmente ou agendado. Cada execução:

1. Consulta o endpoint `/v1/contratacoes/proposta` do PNCP com filtros de data e UF
2. Para cada contratação, busca os itens do edital para extrair os códigos CNAE
3. Transforma e normaliza os campos (datas, texto, UF)
4. Calcula `_mei_compativel` com base no valor estimado
5. Faz upsert no Atlas usando `numeroControlePNCP` como chave única

Para rodar o ETL:
```bash
cd etl-pipeline
uv run python main.py --data-inicial 20260101 --data-final 20261231 --uf PE
```

---

## Documentacao

A documentação completa do projeto — decisões de produto, histórias de usuário, fluxos e especificações técnicas — está no Notion do time:

> https://www.notion.so/noMEI-Gest-o-de-Projeto-343b644657ed8065a36ecb1169276732?pvs=11

A documentação da API (Swagger) fica disponível localmente ao rodar o backend:

> [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Como rodar

Cada camada tem seu próprio README com instruções detalhadas:

- [Backend](./noMEI-backend/README.MD)
- ETL — `cd etl-pipeline && uv run python main.py --help`
- Frontend — `cd front-end/noMEI && npm install && npx expo start`

---

## Time

| Nome | Papel |
|------|-------|
| Débora Almeida Buriti da Silva | Líder de Backend |
| Mirella Emily Bezerra Santana | Desenvolvedora Front-end |
| Myllena Cristiane Ribeiro Navarro Lins | Engenheira de dados |
| Pedro Fernandes Cavalcanti Ferreira | Tech lead |
| Giulliano Lucas Muniz dos Santos | Desenvolvedor Front-end  |
| Ítalo Artur Dantas de Vasconcelos |Desenvolvedor Backend |
| Luis Henrique Facunde | Desenvolvedor Front-end |
| Gustavo Lino de Araújo | Desenvolvedor Backend |


---

## Licenca

Projeto acadêmico. Todos os direitos reservados ao time noMEI.
