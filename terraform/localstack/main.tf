# ========================================================
# Terraform LocalStack Configuration (100% Free Local AWS)
# ========================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider to point to LocalStack on localhost:4566
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    s3             = "http://localhost:4566"
    iam            = "http://localhost:4566"
    sts            = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    logs           = "http://localhost:4566"
  }
}

# 1. Local S3 Bucket for Energy Telemetry Reports
resource "aws_s3_bucket" "reports_bucket" {
  bucket = "energy-monitor-reports-local"

  tags = {
    Environment = "localstack"
    Project     = "EnergyMonitor"
  }
}

# 2. Local Secrets Manager for Database Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "energy-monitor/db-credentials"

  tags = {
    Environment = "localstack"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials_val" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "postgres"
    password = "postgrespassword"
    engine   = "postgres"
    host     = "localhost"
    port     = 5432
    dbname   = "energy_monitor"
  })
}

# 3. Local CloudWatch Log Group for API Logs
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/energy-monitor/api"
  retention_in_days = 7

  tags = {
    Environment = "localstack"
  }
}
