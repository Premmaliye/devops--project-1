# ========================================================
# Terraform LocalStack Outputs
# ========================================================

output "local_ecr_repository_url" {
  description = "Local ECR repository endpoint for docker push/pull"
  value       = aws_ecr_repository.local_api.repository_url
}

output "local_s3_bucket" {
  description = "Local S3 Bucket for reports"
  value       = aws_s3_bucket.reports_bucket.bucket
}

output "secrets_manager_secret_name" {
  description = "Secret name stored in LocalStack Secrets Manager"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "aws_cli_ecr_test_command" {
  description = "Test inspecting your local ECR repository with AWS CLI"
  value       = "aws --endpoint-url=http://localhost:4566 ecr describe-repositories"
}

output "aws_cli_s3_test_command" {
  description = "Test listing your local S3 buckets with AWS CLI"
  value       = "aws --endpoint-url=http://localhost:4566 s3 ls"
}
