# Asthra Service Port Map

All services run on port `8000` inside their containers. Docker Compose publishes each service to a stable host port for local development.

| Service | Suite Name | Host Port | Health | Ready | System Info |
| --- | --- | ---: | --- | --- | --- |
| api-gateway | Asthra API Gateway | 8080 | http://localhost:8080/health | http://localhost:8080/ready | http://localhost:8080/api/gateway/info |
| core-service | Asthra Core | 8000 | http://localhost:8000/health | http://localhost:8000/ready | http://localhost:8000/api/v1/system/info |
| flow-service | Asthra Flow | 8001 | http://localhost:8001/health | http://localhost:8001/ready | http://localhost:8001/api/v1/system/info |
| docs-service | Asthra Docs | 8002 | http://localhost:8002/health | http://localhost:8002/ready | http://localhost:8002/api/v1/system/info |
| ai-service | Asthra Intelligence | 8003 | http://localhost:8003/health | http://localhost:8003/ready | http://localhost:8003/api/v1/system/info |
| memory-service | Asthra Memory | 8004 | http://localhost:8004/health | http://localhost:8004/ready | http://localhost:8004/api/v1/system/info |
| discover-service | Asthra Discover | 8005 | http://localhost:8005/health | http://localhost:8005/ready | http://localhost:8005/api/v1/system/info |
| desk-service | Asthra Desk | 8006 | http://localhost:8006/health | http://localhost:8006/ready | http://localhost:8006/api/v1/system/info |
| pulse-service | Asthra Pulse | 8007 | http://localhost:8007/health | http://localhost:8007/ready | http://localhost:8007/api/v1/system/info |
| dev-service | Asthra Dev | 8008 | http://localhost:8008/health | http://localhost:8008/ready | http://localhost:8008/api/v1/system/info |
| collab-service | Asthra Collab | 8009 | http://localhost:8009/health | http://localhost:8009/ready | http://localhost:8009/api/v1/system/info |
| automation-service | Asthra Automate | 8010 | http://localhost:8010/health | http://localhost:8010/ready | http://localhost:8010/api/v1/system/info |
| connect-service | Asthra Connect | 8011 | http://localhost:8011/health | http://localhost:8011/ready | http://localhost:8011/api/v1/system/info |
| guard-service | Asthra Guard | 8012 | http://localhost:8012/health | http://localhost:8012/ready | http://localhost:8012/api/v1/system/info |
| insights-service | Asthra Insights | 8013 | http://localhost:8013/health | http://localhost:8013/ready | http://localhost:8013/api/v1/system/info |
| media-service | Asthra Media | 8014 | http://localhost:8014/health | http://localhost:8014/ready | http://localhost:8014/api/v1/system/info |

Run all services:

```bash
docker compose up --build
```
