# ☸️ Kubernetes (K8s) Deployment Guide

This directory contains production Kubernetes manifests for running the **Energy Monitor API** stack on Amazon EKS or local Kubernetes (Docker Desktop / Minikube).

---

## 🏛️ Manifests Overview

| Manifest | Kind | Purpose |
| :--- | :--- | :--- |
| `00-namespace.yaml` | `Namespace` | Isolates resources in the `energy-monitoring` namespace |
| `01-configmap.yaml` | `ConfigMap` | Non-sensitive runtime configuration (ports, hosts) |
| `02-secrets.yaml` | `Secret` | Database connection strings and credentials |
| `03-postgres-statefulset.yaml` | `StatefulSet` + `PVC` | Persistent PostgreSQL database with schema init |
| `04-mosquitto-deployment.yaml` | `Deployment` + `Service` | Eclipse Mosquitto MQTT broker on port 1883 |
| `05-api-deployment.yaml` | `Deployment` | 3 API replicas, rolling updates & health probes |
| `06-api-service.yaml` | `Service` | LoadBalancer / NodePort service routing traffic to pods |
| `07-hpa.yaml` | `HorizontalPodAutoscaler` | Auto-scales pods between 2 and 10 based on CPU/RAM |

---

## 🚀 How to Deploy to Kubernetes

### 1. Connect to your Cluster
* **For Local K8s (Docker Desktop):**
  - Open Docker Desktop Settings → **Kubernetes** → Check **Enable Kubernetes** → Click **Apply & restart**.
* **For AWS EKS:**
  ```bash
  aws eks update-kubeconfig --region us-east-1 --name energy-monitor-eks
  ```

### 2. Apply All Manifests in Order
```bash
kubectl apply -f k8s/
```

### 3. Verify Pods & Services
```bash
# Check all resources in the namespace
kubectl get all -n energy-monitoring

# Check persistent volumes
kubectl get pvc -n energy-monitoring
```

### 4. Check Pod Logs
```bash
# Stream API logs
kubectl logs -f -l app=energy-monitor-api -n energy-monitoring
```

---

## 🧹 Teardown
To cleanly remove all Kubernetes resources:
```bash
kubectl delete -f k8s/
```
