# GCP GKE CI/CD Node App

This repository is a complete, small CI/CD example:

- Node.js Express web app
- Dockerfile with a non-root runtime image
- GitHub Actions CI for tests, Terraform validation, image build, Trivy image scan, Artifact Registry push, and GKE deployment
- Terraform for Artifact Registry, GKE Autopilot, VPC networking, GitHub OIDC, and least-needed deployer IAM
- Kubernetes manifests for namespace, deployment, service, and HPA
- Optional Slack notification through `SLACK_WEBHOOK_URL`

## Repository Structure

```text
.
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       └── ci-cd.yml
├── infra/
│   └── terraform/
│       ├── main.tf
│       ├── outputs.tf
│       ├── .terraform.lock.hcl
│       ├── terraform.tfvars.example
│       ├── variables.tf
│       └── versions.tf
├── k8s/
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── namespace.yaml
│   └── service.yaml
├── src/
│   ├── app.js
│   └── server.js
├── test/
│   └── app.test.js
├── .dockerignore
├── .editorconfig
├── .env.example
├── .gitignore
├── .nvmrc
├── Dockerfile
├── docker-compose.yml
├── package-lock.json
├── package.json
└── README.md
```

## Prerequisites

Install:

- Git
- Docker
- Node.js 24
- Google Cloud CLI
- Terraform
- GitHub CLI
- kubectl

You also need a Google Cloud project with billing enabled and permission to create IAM, GKE, VPC, and Artifact Registry resources.

## Run Locally

```bash
npm ci
npm test
npm run check

docker build -t node-gke-cicd:local .
docker run --rm -p 8080:8080 --env-file .env.example node-gke-cicd:local
curl http://localhost:8080/healthz
```

Or with Compose:

```bash
docker compose up --build
```

Open `http://localhost:8080`.

## Create The GitHub Repository

From this repository root:

```bash
export GITHUB_OWNER="your-github-user-or-org"
export GITHUB_REPO="gcp-gke-cicd-node-app"

git init
git add .
git commit -m "Initial GKE CI/CD pipeline"
gh repo create "${GITHUB_OWNER}/${GITHUB_REPO}" --public --source=. --remote=origin --push
```

## Provision GCP With Terraform

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export GITHUB_OWNER="your-github-user-or-org"
export GITHUB_REPO="gcp-gke-cicd-node-app"

gcloud auth login
gcloud config set project "$PROJECT_ID"

cd infra/terraform
terraform init
terraform apply \
  -var="project_id=$PROJECT_ID" \
  -var="region=$REGION" \
  -var="github_owner=$GITHUB_OWNER" \
  -var="github_repo=$GITHUB_REPO"
```

Terraform creates:

- Artifact Registry Docker repository with immutable tags and cleanup policy
- Regional GKE Autopilot cluster
- VPC and subnet secondary ranges for pods/services
- GitHub Workload Identity Federation provider
- GitHub deployer service account
- Repository-level Artifact Registry writer/reader permissions

## Configure GitHub Variables And Secret

Run these commands from `infra/terraform` after `terraform apply`:

```bash
gh variable set GCP_PROJECT_ID -b "$PROJECT_ID" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
gh variable set GCP_REGION -b "$REGION" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
gh variable set GAR_REPOSITORY -b "$(terraform output -raw artifact_registry_repository)" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
gh variable set IMAGE_NAME -b "$(terraform output -raw image_name)" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
gh variable set K8S_NAMESPACE -b "node-gke-cicd" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
gh variable set GKE_CLUSTER -b "$(terraform output -raw gke_cluster_name)" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
gh variable set GKE_LOCATION -b "$(terraform output -raw gke_location)" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
gh variable set GCP_SERVICE_ACCOUNT -b "$(terraform output -raw github_actions_service_account)" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
gh variable set WORKLOAD_IDENTITY_PROVIDER -b "$(terraform output -raw workload_identity_provider)" --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
```

Optional Slack notification:

```bash
gh secret set SLACK_WEBHOOK_URL --repo "${GITHUB_OWNER}/${GITHUB_REPO}"
```

For safer production deployments, create a GitHub Environment named `production` and add required reviewers in repository settings.

## Trigger The Pipeline

```bash
git add .
git commit -m "Configure pipeline"
git push origin main
```

The workflow will:

1. Run Node checks and tests.
2. Validate Terraform.
3. Build the Docker image locally.
4. Scan the image with Trivy for high/critical OS and library vulnerabilities.
5. Push the immutable per-run image tag to Artifact Registry only if the scan passes.
6. Deploy that exact image tag to GKE.
7. Write status to the GitHub Actions job summary and send Slack notification if configured.

## Verify The Deployment

```bash
cd infra/terraform
gcloud container clusters get-credentials "$(terraform output -raw gke_cluster_name)" \
  --region "$(terraform output -raw gke_location)" \
  --project "$PROJECT_ID"

kubectl -n node-gke-cicd get pods
kubectl -n node-gke-cicd get svc node-gke-cicd
```

When the service has an external IP:

```bash
export APP_IP="$(kubectl -n node-gke-cicd get svc node-gke-cicd -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
curl "http://${APP_IP}/healthz"
curl "http://${APP_IP}/api/version"
```

## Clean Up

```bash
cd infra/terraform
terraform destroy \
  -var="project_id=$PROJECT_ID" \
  -var="region=$REGION" \
  -var="github_owner=$GITHUB_OWNER" \
  -var="github_repo=$GITHUB_REPO"
```

## Notes On Best Practices Used

- No long-lived Google Cloud key is stored in GitHub. GitHub Actions authenticates with OIDC and Workload Identity Federation.
- The Docker image is scanned before it is pushed.
- The deployment uses immutable image tags based on `GITHUB_SHA` and `GITHUB_RUN_ATTEMPT`.
- Workflow permissions are scoped per job.
- The Docker runtime runs as a non-root user.
- Kubernetes disables service account token mounting for this app.
- Terraform manages cloud infrastructure, IAM, and registry lifecycle policy.
- Dependabot is enabled for npm, Docker, GitHub Actions, and Terraform updates.
