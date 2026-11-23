# ========================================================
# AWS VPC Architecture for Amazon EKS
# ========================================================

# Fetch available Availability Zones in the region
data "aws_availability_zones" "available" {
  state = "available"
}

# 1. Main Virtual Private Cloud (VPC)
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                           = "${var.cluster_name}-vpc"
    "kubernetes.io/cluster/${var.cluster_name}"   = "shared"
  }
}

# 2. Internet Gateway for Public Internet Traffic
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.cluster_name}-igw"
  }
}

# 3. Public Subnets (for ALBs & Ingress Controllers)
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                           = "${var.cluster_name}-public-subnet-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}"   = "shared"
    "kubernetes.io/role/elb"                      = "1" # Required for AWS Load Balancer Controller
  }
}

# 4. Private Subnets (for EKS Worker Nodes & Databases)
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                           = "${var.cluster_name}-private-subnet-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}"   = "shared"
    "kubernetes.io/role/internal-elb"             = "1" # Required for Internal Load Balancers
  }
}

# 5. Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.cluster_name}-nat-eip"
  }
}

# 6. NAT Gateway (enables private subnets to pull images and updates securely)
resource "aws_nat_gateway" "gw" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.cluster_name}-nat-gateway"
  }

  depends_on = [aws_internet_gateway.gw]
}

# 7. Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "${var.cluster_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# 8. Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.gw.id
  }

  tags = {
    Name = "${var.cluster_name}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

