{{/* Common labels */}}
{{- define "microservice-app.labels" -}}
app.kubernetes.io/name: microservice-app
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

