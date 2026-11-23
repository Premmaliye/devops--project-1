#!/usr/bin/env bash
set -e

LOCALSTACK_URL="${LOCALSTACK_URL:-http://localhost:4566}"
AWS_REGION="us-east-1"
ECR_REPO_NAME="energy-monitor-api"
S3_BUCKET_NAME="energy-monitor-reports-local"
SECRET_NAME="energy-monitor/db-credentials"

echo "======================================================"
echo "☁️  Energy Monitor - LocalStack (Local AWS) Setup"
echo "   Endpoint: $LOCALSTACK_URL"
echo "======================================================"

# 1. Wait for LocalStack to be ready
echo "⏳ Checking LocalStack health..."
until curl -s "$LOCALSTACK_URL/_localstack/health" | grep -q "\"ecr\": \"available\""; do
  echo "   Waiting for LocalStack services to become ready..."
  sleep 3
done
echo "✅ LocalStack is UP and healthy!"

# 2. Check if aws-cli is available, otherwise use curl against the REST APIs
if command -v aws &> /dev/null; then
  export AWS_ACCESS_KEY_ID=test
  export AWS_SECRET_ACCESS_KEY=test
  export AWS_DEFAULT_REGION=$AWS_REGION

  echo "📦 Creating local ECR repository: $ECR_REPO_NAME..."
  aws --endpoint-url="$LOCALSTACK_URL" ecr create-repository --repository-name "$ECR_REPO_NAME" 2>/dev/null || echo "   (Repository already exists)"

  echo "🪣 Creating local S3 bucket: $S3_BUCKET_NAME..."
  aws --endpoint-url="$LOCALSTACK_URL" s3 mb "s3://$S3_BUCKET_NAME" 2>/dev/null || echo "   (Bucket already exists)"

  echo "🔐 Storing DB credentials in Local Secrets Manager: $SECRET_NAME..."
  aws --endpoint-url="$LOCALSTACK_URL" secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --secret-string '{"username":"postgres","password":"postgrespassword","host":"localhost","port":5432,"dbname":"energy_monitor"}' 2>/dev/null || \
  aws --endpoint-url="$LOCALSTACK_URL" secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string '{"username":"postgres","password":"postgrespassword","host":"localhost","port":5432,"dbname":"energy_monitor"}' 2>/dev/null || true

  echo ""
  echo "🎉 Local AWS Services successfully configured!"
  echo ""
  echo "🔍 Verification Commands:"
  echo "   ECR Repositories : aws --endpoint-url=$LOCALSTACK_URL ecr describe-repositories"
  echo "   S3 Buckets       : aws --endpoint-url=$LOCALSTACK_URL s3 ls"
  echo "   Secrets Manager  : aws --endpoint-url=$LOCALSTACK_URL secretsmanager get-secret-value --secret-id $SECRET_NAME"
else
  echo "ℹ️  AWS CLI not installed yet. You can install it with: brew install awscli"
  echo "   LocalStack is running on $LOCALSTACK_URL and ready for Terraform!"
fi
