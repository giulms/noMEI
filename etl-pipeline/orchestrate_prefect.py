"""
Módulo de orquestração do pipeline ETL do PNCP utilizando Prefect.

Responsável por:
- Definir tarefas monitoráveis (@task)
- Coordenar o fluxo de execução (@flow)
- Adicionar logs e controle de falhas (retries)
- Permitir execução manual e futura automação (schedule)

Este módulo integra o pipeline ETL já existente com um orquestrador,
possibilitando monitoramento e reexecução controlada.
"""

from prefect import flow, task, get_run_logger
from dotenv import load_dotenv

from config.settings import Settings
from src.pipeline import ETLPipeline

load_dotenv()


@task(retries=3, retry_delay_seconds=10)
def run_etl(
    data_inicial: str,
    data_final: str,
    max_paginas: int | None = None,
) -> bool:
    """
    Executa o pipeline ETL do PNCP como uma tarefa orquestrada.

    Args:
        data_inicial (str): Data inicial no formato YYYYMMDD.
        data_final (str): Data final no formato YYYYMMDD.
        max_paginas (int | None): Limite de páginas para testes.

    Returns:
        bool: Indica se a execução foi bem-sucedida.

    Funcionalidades:
        - Executa o pipeline ETL completo
        - Registra logs de execução
        - Possui retry automático em caso de falha
    """
    logger = get_run_logger()

    settings = Settings()
    pipeline = ETLPipeline(settings)

    extract_params = {
        "data_inicial": data_inicial,
        "data_final": data_final,
        "max_paginas": max_paginas,
    }

    logger.info("Iniciando execução do ETL")

    result = pipeline.run(extract_params)

    logger.info("ETL finalizado")
    logger.info(f"Sucesso: {result.sucesso}")
    logger.info(f"Total transformado: {result.total_transformado}")

    return result.sucesso


@flow(name="ETL PNCP Flow", log_prints=True)
def etl_flow(
    data_inicial: str = "20260507",
    data_final: str = "20260508",
    max_paginas: int = 1,
) -> None:
    """
    Define o fluxo orquestrado do ETL PNCP.

    Args:
        data_inicial (str): Data inicial da extração.
        data_final (str): Data final da extração.
        max_paginas (int): Limite de páginas para execução.

    Fluxo:
        1. Executa a task de ETL (run_etl)
        2. Controla a ordem de execução
        3. Permite monitoramento via Prefect

    Este fluxo representa a camada de orquestração do pipeline.
    """
    run_etl(data_inicial, data_final, max_paginas)


if __name__ == "__main__":
    """
    Ponto de entrada para execução manual do fluxo.

    Executa o ETL com parâmetros padrão.
    """
    etl_flow()
