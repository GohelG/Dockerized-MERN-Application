pipeline {
    agent any
    
    environment {
        ACR_REGISTRY   = 'mernapplication.azurecr.io'
        RESOURCE_GROUP = 'MERN-Application'
        AKS_CLUSTER    = 'MernCluster'
    }
    
    stages {
        stage('Fetch Code Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/GohelG/Dockerized-MERN-Application.git'
            }
        }
        
        stage('Dockerize & Package Components') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PASS')]) {
                    sh 'echo $ACR_PASS | docker login ${ACR_REGISTRY} -u $ACR_USER --password-stdin'
                    
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
                // Securely bound Azure parameters alongside application secret strings
                withCredentials([
                    azureServicePrincipal('azure-service-principal'),
                    string(credentialsId: 'prod-mongo-uri', variable: 'DB_URI'),
                    string(credentialsId: 'prod-jwt-secret', variable: 'JWT_KEY')
                ]) {
                    sh '''
                        az login --service-principal \
                          -u "$AZURE_CLIENT_ID" \
                          -p "$AZURE_CLIENT_SECRET" \
                          --tenant "$AZURE_TENANT_ID"
                        
                        az account set --subscription "$AZURE_SUBSCRIPTION_ID"
                        
                        az aks get-credentials \
                          --resource-group "$RESOURCE_GROUP" \
                          --name "$AKS_CLUSTER" \
                          --overwrite-existing
                        
                        # Injected secrets directly into the helm parameters array block
                        helm upgrade --install multi-service-app ./helm-charts \
                          --set global.registry="${ACR_REGISTRY}" \
                          --set global.tag="${BUILD_NUMBER}" \
                          --set secrets.mongoUri="${DB_URI}" \
                          --set secrets.jwtSecret="${JWT_KEY}"
                    '''
                }
            }
        }
    }

    post {
        always {
            deleteDir()
            sh 'docker image prune -f'
        }
    }
}

