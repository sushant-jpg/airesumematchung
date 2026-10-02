FROM python:3.12-slim
WORKDIR /service
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN useradd --create-home appuser
COPY apps/ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/ai-service/app ./app
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/ready')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
