# Usa imagem base do Python
FROM python:3.11-slim

# Variáveis de ambiente para evitar cache e buffer
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Diretório de trabalho dentro do container
WORKDIR /app

# Instala dependências de sistema (necessárias para conectar em MySQL/Postgres)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential default-libmysqlclient-dev \
 && rm -rf /var/lib/apt/lists/*

# Copia o requirements.txt e instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o código do projeto
COPY . .

# Expõe a porta do Flask
EXPOSE 5000

# Comando para rodar o app
CMD ["python", "src/main.py"]
