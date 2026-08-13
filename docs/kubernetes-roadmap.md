# Asthra Kubernetes Roadmap

Kubernetes is a future deployment target. The current platform remains Docker Compose only.

## Future Kubernetes Components

- Deployment per service
- Service per service
- ConfigMaps for non-secret config
- Secrets for sensitive config
- PersistentVolumes only where needed
- readiness and liveness probes
- ingress through API Gateway

## Helm Roadmap

Asthra should eventually use Helm charts for:

- service deployment templates
- environment-specific values
- resource requests and limits
- health probes
- ingress rules

## Cloud Targets

Future clusters may run on:

- EKS
- GKE
- AKS

## Rules

- Do not introduce Kubernetes manifests before deployment requirements are clear.
- Keep service ownership and database ownership intact.
- API Gateway should be the primary public ingress.
