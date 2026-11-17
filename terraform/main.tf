# ========================================================
# Terraform Provider & Backend Configuration
# ========================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional remote state backend (S3 + DynamoDB for locking)
  # backend "s3" {
  #   bucket         = "my-terraform-state-bucket"
  #   key            = "energy-monitor/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "EnergyMonitor"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
