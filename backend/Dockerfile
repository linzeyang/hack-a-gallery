FROM public.ecr.aws/docker/library/python:3.12-slim
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies
RUN pip install -i https://mirror.zju.edu.cn/pypi/web/simple --no-cache-dir fastapi==0.119.0 uvicorn[standard]==0.38.0 boto3>=1.40.0 \
    pydantic==2.12.3 pydantic-settings==2.11.0 httpx==0.28.1 python-multipart==0.0.20

# Copy application code
COPY app ./app

# Set environment variables for Lambda Web Adapter
ENV PORT=8080

# Start FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
