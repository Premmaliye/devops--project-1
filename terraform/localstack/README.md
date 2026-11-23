# ☁️ LocalStack (Local AWS Cloud Simulator)

Run AWS services on your local machine **for free** with zero AWS account, zero credit card, and zero cloud costs.

---

## 🚀 Services Configured in LocalStack

- **AWS ECR (Elastic Container Registry):** Local container registry for storing `energy-monitor-api` Docker images.
- **AWS S3:** Storage bucket for energy consumption and telemetry reports (`energy-monitor-reports-local`).
- **AWS Secrets Manager:** Secure storage for database credentials (`energy-monitor/db-credentials`).
- **AWS CloudWatch:** Centralized log group for application logging (`/aws/energy-monitor/api`).

---

## 🛠️ Quickstart

### 1. Start LocalStack (via Docker Compose)
```bash
docker compose up -d localstack
```

Verify it is running:
```bash
curl http://localhost:4566/_localstack/health
```

---

### 2. Run Terraform Against LocalStack

Navigate to the `terraform/localstack/` directory:
```bash
cd terraform/localstack
```

Initialize and apply:
```bash
terraform init
terraform apply -auto-approve
```

---

### 3. Inspect Local AWS Services with AWS CLI

Once Terraform applies, you can use the AWS CLI by adding `--endpoint-url=http://localhost:4566`:

#### View ECR Repositories:
```bash
aws --endpoint-url=http://localhost:4566 ecr describe-repositories
```

#### View S3 Buckets:
```bash
aws --endpoint-url=http://localhost:4566 s3 ls
```

#### Read Database Secret from Secrets Manager:
```bash
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value --secret-id energy-monitor/db-credentials
```

---

### 🐳 Pushing your Docker Image to Local ECR

```bash
# 1. Tag your image for the local ECR
docker tag energy-monitor-api:1.0.0 localhost:4566/energy-monitor-api:latest

# 2. Push to local ECR
docker push localhost:4566/energy-monitor-api:latest

# 3. Verify the image in local ECR
aws --endpoint-url=http://localhost:4566 ecr list-images --repository-name energy-monitor-api
```
