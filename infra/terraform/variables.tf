variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Google Cloud region for Artifact Registry and the regional GKE cluster."
  type        = string
  default     = "us-central1"
}

variable "github_owner" {
  description = "GitHub user or organization that owns the repository."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
}

variable "artifact_registry_repository" {
  description = "Artifact Registry Docker repository name."
  type        = string
  default     = "node-gke-cicd"
}

variable "image_name" {
  description = "Docker image name inside Artifact Registry."
  type        = string
  default     = "node-gke-cicd"
}

variable "gke_cluster_name" {
  description = "GKE cluster name."
  type        = string
  default     = "node-gke-cicd"
}

variable "network_name" {
  description = "VPC network name."
  type        = string
  default     = "node-gke-cicd"
}

variable "subnet_cidr" {
  description = "Primary subnet CIDR."
  type        = string
  default     = "10.10.0.0/20"
}

variable "pods_cidr" {
  description = "Secondary range for GKE pods."
  type        = string
  default     = "10.20.0.0/16"
}

variable "services_cidr" {
  description = "Secondary range for GKE services."
  type        = string
  default     = "10.30.0.0/20"
}

variable "wif_pool_id" {
  description = "Workload Identity Federation pool ID for GitHub Actions."
  type        = string
  default     = "github-actions"
}

variable "wif_provider_id" {
  description = "Workload Identity Federation provider ID for GitHub Actions."
  type        = string
  default     = "github"
}

variable "labels" {
  description = "Labels applied to supported Google Cloud resources."
  type        = map(string)
  default = {
    app = "node-gke-cicd"
  }
}

