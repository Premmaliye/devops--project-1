# ========================================================
# Terraform Output Values
# ========================================================

output "region" {
  description = "AWS Region where resources are deployed"
  value       = var.aws_region
}

output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = aws_vpc.main.id
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository to push Docker images"
  value       = aws_ecr_repository.api.repository_url
}

output "eks_cluster_name" {
  description = "The name of the provisioned EKS Cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint for the EKS Kubernetes API server"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_arn" {
  description = "ARN of the EKS Cluster"
  value       = aws_eks_cluster.main.arn
}

output "configure_kubectl" {
  description = "Run this command on your terminal to connect kubectl to your new EKS cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}

