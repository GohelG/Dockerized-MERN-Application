pipeline {
    agent any
    
    environment {
        ACR_REGISTRY   = 'mernregistryprod.azurecr.io'
        RESOURCE_GROUP = 'MERN-Application'
        AKS_CLUSTER    = 'MernCluster'
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
                helm upgrade --install multi-service-app ./helm-charts \
                  --set global.registry=${ACR_REGISTRY} \
                  --set global.tag=${BUILD_NUMBER}
                """
            }
        }
    }
}