# ========================================================
# Input Variables
# ========================================================

variable "aws_region" {
  description = "AWS region for infrastructure provisioning"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "cluster_name" {
  description = "Name of the Amazon EKS cluster"
  type        = string
  default     = "energy-monitor-eks"
}

variable "kubernetes_version" {
  description = "Kubernetes control plane version"
  type        = string
  default     = "1.30"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (used by Internet-facing Load Balancers)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (used by EKS worker nodes and DB)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "ecr_repository_name" {
  description = "Name of the AWS ECR container repository"
  type        = string
  default     = "energy-monitor-api"
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS worker nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_capacity" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

variable "node_min_capacity" {
  description = "Minimum number of worker nodes for auto-scaling"
  type        = number
  default     = 1
}

variable "node_max_capacity" {
  description = "Maximum number of worker nodes for auto-scaling"
  type        = number
  default     = 4
}

