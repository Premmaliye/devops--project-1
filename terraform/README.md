# 🌍 Infrastructure as Code (Terraform for AWS)

This directory contains modular Terraform configuration to provision production-grade AWS infrastructure for the **Energy Monitor API**.

---

## 🏛️ Resources Provisioned

1. **Virtual Private Cloud (VPC)**:
   - 2 Public Subnets (multi-AZ) for Application Load Balancers.
   - 2 Private Subnets (multi-AZ) for EKS Worker Nodes.
   - Internet Gateway & NAT Gateway with Elastic IP.
   - Proper Kubernetes tags for AWS Load Balancer Controller discovery.
2. **Amazon Elastic Container Registry (ECR)**:
   - Encrypted Docker image repository (`energy-monitor-api`).
   - Image vulnerability scanning on push.
   - Lifecycle policy auto-expiring old builds.
3. **Amazon Elastic Kubernetes Service (EKS)**:
   - High-availability Kubernetes Control Plane (v1.30).
   - IAM Roles & Least-Privilege Policies.
4. **EKS Managed Node Group**:
   - Auto-scaling worker node group (`t3.medium`) inside private subnets.

---

## 🚀 How to Deploy

### 1. Prerequisites
- [AWS CLI](https://aws.amazon.com/cli/) installed & configured (`aws configure`).
- [Terraform](https://developer.hashicorp.com/terraform/install) installed (`brew install terraform`).

### 2. Configure Variables
Copy the example variables file:
```bash
cp terraform.tfvars.example terraform.tfvars
```

### 3. Initialize & Deploy
```bash
# Initialize Terraform providers
terraform init

# Review planned changes
terraform plan

# Apply infrastructure to AWS
terraform apply
```

### 4. Connect `kubectl` to EKS
Once `terraform apply` finishes, it outputs the command:
```bash
aws eks update-kubeconfig --region us-east-1 --name energy-monitor-eks
```

Verify connection:
```bash
kubectl get nodes
```

---

## 🧹 Teardown (Avoid AWS Costs)
When finished testing:
```bash
terraform destroy
```
