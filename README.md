# 🚀 Dockerized Microservices Deployment on Azure Kubernetes Service (AKS) via Jenkins
This repository contains the configuration blueprints, Helm charts, and Jenkins automation logic required to build and deploy a production-grade multi-service microservices application onto **Microsoft Azure** using an independent automation server.

---

## 🏗️ System Architecture & Workflow

```text
[Git SCM] 🦊 ---> [Jenkins Server (Azure VM)] 🛠️ ---> [Azure Container Registry (ACR)] 📦
                                                                |
                                                                v
[Slack/Teams] 💬 <--- [Azure Monitor / Insights] <--- [Azure Kubernetes Service (AKS)] ☸️
                                                                |
                                                                +---> [MongoDB Atlas] 🍃 (cloud.mongodb.com)
```

1. **Commit:** Code updates to the tracking branch trigger a Webhook notification down to Jenkins.
2. **Build (CI):** The Jenkins agent builds multi-stage Docker artifacts, tags them with build numbers, and authenticates to push to Azure Container Registry (ACR).
3. **Deploy (CD):** Jenkins utilizes installed CLI binaries (`az`, `kubectl`, `helm`) to update resources running inside the Azure Kubernetes Service (AKS) cluster.
4. **Data:** Backend microservices securely mount data pipes to a managed MongoDB Atlas Cluster hosted on `cloud.mongodb.com`.
---

## 📂 Project Structure

```text
├── backend/
│   ├── apiGateway/        # Express Reverse Proxy & Request Router (Port 5000)
│   ├── helloService/      # Core Data Service (Port 5001)
│   └── profileService/    # User Profile Service (Port 5002)
├── frontend/              # React UI Bundle served via Nginx (Port 80)
├── helm-charts/           # Parameterized Kubernetes manifest templates
└── Jenkinsfile            # Declarative CI/CD automation script
```
---

## 🛠️ Infrastructure Provisioning Steps

### Step 1: Install Azure CLI on Your Local WorkstationBefore you can interact with Microsoft Azure, you must install the Azure CLI tool on your local administration machine. Run the command corresponding to your operating system:

#### 🔹 For Ubuntu / Debian Linux:

```bash
curl -sL https://aka.ms | sudo bash
```

#### 🔹 For macOS (using Homebrew):

```bash
brew update && brew install azure-cli
```

#### 🔹 For Windows (PowerShell as Administrator):

```powershell
$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri https://aka.ms -OutFile .\AzureCLI.msi; Start-Process msiexec.exe -ArgumentList '/i AzureCLI.msi /quiet /norestart' -Wait; Remove-Item .\AzureCLI.msi
```
---

### Step 2: Automated VM Deployment (Azure CLI)Open your local terminal workspace and execute these commands to initialize your cloud infrastructure resource workspace and the Jenkins VM platform:

```bash
# 1. Authenticate session with cloud subscription
az login

# 2. Create target resource workspace group
az group create --name MERN-Application --location eastus

# 3. Create private Docker container storage registry
az acr create --resource-group MERN-Application --name mernregistryprod --sku Basic

# 4. Provision the Jenkins Host Instance VM
az vm create \
  --resource-group MERN-Application \
  --name JenkinsAutomationServer \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard
```

---

### Step 3: System User Management & Security HardeningSSH into your newly provisioned Azure VM instance as the root administrator (`azureuser`) to initialize dedicated engineering groups.

#### 1. Linux User Creation & Passwordless Sudo AccessExecute the following commands to create a dedicated pipeline deployer user (`jenkins`) and safely configure non-interactive administrative overrides:

```bash
# Create the deployment service user account
sudo useradd -m -s /bin/bash jenkins

# Append a specific passwordless entry into the system sudoers directory structure
echo "jenkins ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/jenkins

# Enforce secure permission constraints on the override block file
sudo chmod 0440 /etc/sudoers.d/jenkins
```

#### 2. Configure Passwordless SSH Key AuthenticationConfigure key-pair mapping to allow your administrative workspace terminal or Git agents to securely connect to the `jenkins` runner profile without interactive password challenge blocks:

```bash
# Switch execution context down to the newly deployed user space
sudo su - jenkins

# Generate a high-entropy 4096-bit RSA asymmetric infrastructure security token
ssh-keygen -t rsa -b 4096 -N "" -f ~/.ssh/id_rsa

# Create a secured access repository folder structure
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Append your local deployment terminal's PUBLIC key string directly into the authorization list
echo "<YOUR_PASTED_PUBLIC_SSH_KEY_STRING>" >> ~/.ssh/authorized_keys

# Enforce explicit reading constraints on the configuration matrix files
chmod 600 ~/.ssh/authorized_keys
```

*Verification Check:* From your local system workstation, confirm passwordless handshake execution by running: `ssh -i /path/to/local/private_key jenkins@<YOUR_VM_PUBLIC_IP>`.

---

### Step 4: Production Engine & Node Toolchain InstallationWhile logged into the automation host machine, run this combined shell script to download, configure, and initialize the core Node, Docker, Azure CLI, and Jenkins service engines:

```bash
# 1. Update system package repository metadata layers
sudo apt-get update && sudo apt-get upgrade -y

# 2. Setup Node.js Native Runtime Environment (LTS 18.x)
curl -fsSL https://nodesource.com | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Download and register the official OpenJDK 17 Runtime Java Architecture
sudo apt-get install openjdk-17-jre -y

# 4. Install Jenkins Automation Server Engine
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc https://jenkins.io
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://jenkins.io binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update && sudo apt-get install jenkins -y

# 5. Install Docker Engine and authorize local group cross-communication sockets
sudo apt-get install docker.io -y
sudo usermod -aG docker jenkins
sudo usermod -aG docker azureuser

# 6. Fetch down cloud orchestration binaries (Azure CLI, Kubectl, and Helm)
curl -sL https://aka.ms | sudo bash
sudo az aks install-cli
curl https://githubusercontent.com | bash

# 7. Restart and anchor critical background service daemons
sudo systemctl daemon-reload
sudo systemctl restart jenkins
sudo systemctl restart docker
sudo systemctl enable jenkins
sudo systemctl enable docker
```
---

### Step 5: Configure Jenkins Server Credentials
Open the Jenkins Web Console UI via your server port (`http://<YOUR_VM_PUBLIC_IP>:8080`) and configure these settings under **Manage Jenkins -> Credentials**:

1. **ACR Registry Credentials (`ID: acr-credentials`)**: Select type *Username with password*. Input your Azure Container Registry Admin username and password.
2. **Azure Service Principal (`ID: azure-service-principal`)**: Select type *Microsoft Azure Service Principal* (or *Secret text* fields). Generate the target cloud access JSON payload using the following CLI command:

```bash
az ad sp create-for-rbac --name "jenkins-aks-sp" --role "Contributor" --scopes "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/MERN-Application"
```
---

### Step 6: The Jenkins Continuous Integration PipelineCreate a new **Pipeline** project in Jenkins, configure the source link to your Git repository, and reference the `Jenkinsfile`:

```groovy

pipeline {
    agent any
    
    environment {
        ACR_REGISTRY   = 'mernregistryprod.azurecr.io'
        RESOURCE_GROUP = 'MERN-Application'
        AKS_CLUSTER    = 'MernAKSCluster'
        SP_CREDENTIALS = credentials('azure-service-principal')
    }
    
    stages {
        stage('Fetch Code Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Dockerize & Package Components') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASS')]) {
                    sh "docker login ${ACR_REGISTRY} -u ${ACR_USER} -p ${ACR_PASS}"
                    
                    sh "docker build -t ${ACR_REGISTRY}/api-gateway:${BUILD_NUMBER} ./backend/apiGateway"
                    sh "docker push ${ACR_REGISTRY}/api-gateway:${BUILD_NUMBER}"
                    
                    sh "docker build -t ${ACR_REGISTRY}/hello-service:${BUILD_NUMBER} ./backend/helloService"
                    sh "docker push ${ACR_REGISTRY}/hello-service:${BUILD_NUMBER}"
                    
                    sh "docker build -t ${ACR_REGISTRY}/profile-service:${BUILD_NUMBER} ./backend/profileService"
                    sh "docker push ${ACR_REGISTRY}/profile-service:${BUILD_NUMBER}"
                    
                    sh "docker build -t ${ACR_REGISTRY}/frontend:${BUILD_NUMBER} ./frontend"
                    sh "docker push ${ACR_REGISTRY}/frontend:${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Deploy Infrastructure to AKS Cluster') {
            steps {

sh "az login --service-principal -u ${SP_CREDENTIALS_CLIENT_ID} -p ${SP_CREDENTIALS_CLIENT_SECRET} --tenant ${SP_CREDENTIALS_TENANT_ID}"
sh "az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER} --overwrite-existing"
sh """
helm upgrade --install multi-service-app ./helm-charts 
--set global.registry=${ACR_REGISTRY} 
--set global.tag=${BUILD_NUMBER}
"""
}
}
}
}
```
------------------------------

## ☸️ Kubernetes Deployment (AKS Setup)

## 1. Create the Managed AKS Cluster
Attach the newly created ACR registry directly during initialization to automatically handle cross-service authentication tokens securely:

```bash
## Generate and save SSH keys securely
az sshkey create --resource-group MERN-Application --name MernClusterKey
## To save existing ssh key from azure "key vault" to your local on system  
az sshkey show --resource-group MERN-Application --name Jenkins-Server_key --query publicKey -o tsv > ~/.ssh/Jenkins-Server_key.pub
## Create AKS Cluster and pair with your Container Registry
az aks create 
--resource-group MERN-Application 
--name MernAKSCluster 
--node-count 2 
--generate-ssh-keys 
--attach-acr mernregistryprod
```
## 2. Configure MongoDB Atlas Connections
Before deploying via Helm, log into your MongoDB Atlas Console at cloud.mongodb.com and configure database integration:

1. Whitelisting: Add your AKS Cluster outbound public IPs (or allow 0.0.0.0/0 temporarily) inside the MongoDB Atlas Network Access panel.
2. Database User: Create an access profile under Database Access using SCRAM authentication.
3. ConnectionString Injection: Update your Helm values.yaml or inject the connection string token directly:

```yaml
## Update inside helm-charts/values.yamlglobal:
mongoUri: "mongodb+srv://:@cluster0.xxxx.mongodb.net/production?retryWrites=true&w=majority"
```

------------------------------

## 🌐 NGINX Ingress Controller & Automated SSL (Cert-Manager)
To drop raw, exposed Kubernetes Layer-4 LoadBalancers in favor of a single Layer-7 path router running automated Let's Encrypt TLS certificates, configure the following components:

## Step 1: Install NGINX Ingress Controller
Run these commands from your local administration workstation to install the cluster Ingress engine via Helm:

```bash
helm repo add ingress-nginx github.io
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx 
--namespace ingress-basic --create-namespace 
--set controller.replicaCount=2 
--set controller.nodeSelector."kubernetes.io/os"=linux
```
## Step 2: Install Cert-Manager
Deploy Cert-Manager to automate the provisioning, lifecycle tracking, and validation renewal steps of your SSL keys:

```bash
helm repo add jetstack jetstack.io
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager 
--namespace cert-manager --create-namespace 
--set installCRDs=true
```

## Step 3: Configure Let's Encrypt ClusterIssuer
Create a global cluster configuration template inside helm-charts/templates/cluster-issuer.yaml to request certificates via ACME challenges:
yaml apiVersion: cert-manager.io/v1 kind: ClusterIssuer metadata: name: letsencrypt-prod spec: acme: server: https://letsencrypt.org email: your-ops-team@yourdomain.com privateKeySecretRef: name: letsencrypt-prod-account-key solvers: - http01: ingress: ingressClassName: nginx 

## Step 4: Define Routing and TLS Termination Rules
Create your unified ingress map inside helm-charts/templates/ingress.yaml to handle domain maps and strip SSL headers safely:
yaml apiVersion: networking.k8s.io/v1 kind: Ingress metadata: name: app-ingress annotations: kubernetes.io/ingress.class: "nginx" cert-manager.io/cluster-issuer: "letsencrypt-prod" nginx.ingress.kubernetes.io/ssl-redirect: "true" nginx.ingress.kubernetes.io/use-regex: "true" spec: tls: - hosts: - ://yourdomain.com secretName: app-tls-cert-secret rules: - host: ://yourdomain.com http: paths: - path: /api/.* pathType: ImplementationSpecific backend: service: name: api-gateway-svc port: number: 5000 - path: / pathType: Prefix backend: service: name: frontend-svc port: number: 80

------------------------------
## 🛡️ Pod Self-Healing: Liveness & Readiness Probes
To ensure zero-downtime rolling updates and instruct Kubernetes to isolate or gracefully reboot crashed container services, add health checkpoints to your deployment manifests.

## 1. Update Backend Manifest Probes
Modify helm-charts/templates/gateway-deployment.yaml (along with your hello and profile service templates) to query internal loops safely before routing traffic:
yaml spec: containers: - name: api-gateway image: "{{ .Values.global.registry }}/api-gateway:{{ .Values.global.tag }}" readinessProbe: httpGet: path: /api/hello port: 5000 initialDelaySeconds: 15 periodSeconds: 10 timeoutSeconds: 3 failureThreshold: 3 livenessProbe: httpGet: path: /api/hello port: 5000 initialDelaySeconds: 20 periodSeconds: 15 timeoutSeconds: 5 failureThreshold: 3 

## 2. Update Frontend Manifest Probes
Since the React bundle is served inside an Nginx runtime image, update helm-charts/templates/frontend-deployment.yaml to monitor the root path index directly:
yaml spec: containers: - name: frontend image: "{{ .Values.global.registry }}/frontend:{{ .Values.global.tag }}" readinessProbe: httpGet: path: / port: 80 initialDelaySeconds: 10 periodSeconds: 10 livenessProbe: httpGet: path: / port: 80 initialDelaySeconds: 15 periodSeconds: 20

------------------------------

## 📈 Monitoring, Metrics, and Centralized Logging## 1. Performance Dashboards

* Track node and pod resource usage through Azure Monitor Container Insights.
* View live memory allocations and CPU thresholds inside the Azure Portal under your AKS Cluster -> Insights.

## 2. Centralized Cluster Logs

* Pod stdout streams are automatically pipelined into an Azure Log Analytics Workspace.
* Query running log instances using the Kusto Query Language (KQL):
kusto KubePodInventory | where ContainerName == "api-gateway" | project TimeGenerated, PodName, ContainerStatus, Namespace 

------------------------------

## 🏁 Final Validation & Service Ingress Testing
Follow these steps to confirm cluster ingress endpoints, load balancer routing, and backend microservice channels are healthy and exposed correctly.

## Step 1: Track Ingress Controllers
Run this tracking command to get the global ingress public controller interface IP address:
bash kubectl get ingress app-ingress -w 
Map this external IP address inside your domain name server registration settings (such as Azure DNS or Cloudflare) as an A Record targeting ://yourdomain.com.

------------------------------

## Step 2: Validate the SSL/TLS Handshake
Execute this curl command from your local machine to verify that your certificate chain is secure and active:
bash curl -Iv https://yourdomain.com 
Expected Output Validation:

```text
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* ALPN, server accepted to use h2
* Server certificate:
* subject: CN=yourdomain.com
* start date: Jul 12 00:00:00 2026 GMT
* expire date: Oct 10 00:00:00 2026 GMT
* issuer: C=US; O=Let's Encrypt; CN=R3
* SSL certificate verify ok.
HTTP/2 200
content-type: application/json
```

------------------------------

## 🚨 Troubleshooting Connection Failures
If you receive timeout errors, standard 502 Bad Gateway, or 404 Not Found messages, run these discovery diagnostics:

```bash
## 1. Confirm Cert-Manager issued the key-pair safely
kubectl get certificate
## 2. View life cycle event loops for failing orders
kubectl describe challenge
## 3. Check live output stream logs for internal routing exceptions inside the NGINX controller
kubectl logs -n ingress-basic daemonset/ingress-nginx-controller --tail=50
```

# 👨‍💻 Author

**Gautam Gohel**

System Administrator | SRE Engineer | Cloud & DevOps Enthusiast 🚀

---
---