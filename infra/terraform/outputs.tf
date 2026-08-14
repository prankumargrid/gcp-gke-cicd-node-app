output "artifact_registry_repository" {
  description = "Artifact Registry repository name."
  value       = google_artifact_registry_repository.app.repository_id
}

output "artifact_registry_registry" {
  description = "Artifact Registry Docker registry hostname."
  value       = "${var.region}-docker.pkg.dev"
}

output "image_name" {
  description = "Container image name."
  value       = var.image_name
}

output "image_uri_without_tag" {
  description = "Container image URI without tag."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}/${var.image_name}"
}

output "gke_cluster_name" {
  description = "GKE cluster name."
  value       = google_container_cluster.app.name
}

output "gke_location" {
  description = "GKE cluster region."
  value       = google_container_cluster.app.location
}

output "github_actions_service_account" {
  description = "Service account impersonated by GitHub Actions."
  value       = google_service_account.github_actions.email
}

output "workload_identity_provider" {
  description = "Full Workload Identity Provider resource name for GitHub Actions."
  value       = google_iam_workload_identity_pool_provider.github.name
}

