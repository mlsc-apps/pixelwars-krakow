# Terraform
resource "google_service_account" "service_account" {
  account_id   = "github-sa"
  display_name = "service account for github cicd pipeline"
  project      = var.project_id
}

resource "google_project_iam_member" "role-binding" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:github-sa@pixelwars-348612.iam.gserviceaccount.com"
}

resource "google_service_account_key" "key" {
  service_account_id = "github-sa@pixelwars-348612.iam.gserviceaccount.com"
}
output "service_account_json_key" {
  value = "${google_service_account_key.key.private_key}"
}