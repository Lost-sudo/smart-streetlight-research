# Docker Deployment & Storage Optimization Guide

This guide ensures you can run the Smart Streetlight backend efficiently while keeping your local machine's storage footprint as small as possible.

## 🚀 Quick Start
To build and start the server:
```bash
cd server
docker-compose up --build
```

To stop the server:
```bash
docker-compose down
```

---

## 💾 Storage Optimization Tips

Docker components (images, layers, and caches) can accumulate over time. Use these commands to keep your storage clean:

### 1. The "Magic" Cleanup Command
This removes all stopped containers, unused networks, and "dangling" images (layers that are no longer referenced).
```bash
docker system prune
```
> [!TIP]
> Add the `-a` flag to remove all unused images (not just dangling ones): `docker system prune -a`

### 2. Clean Build Cache
Docker saves build steps to make subsequent builds faster. If you are low on space:
```bash
docker builder prune
```

### 3. Proper Shutdown
Always use `down` instead of just stopping the container. `down` removes the container and network resources entirely.
```bash
docker-compose down
```

### 4. Optimize Image Size (Already Configured)
We have already implemented several best practices in your `Dockerfile`:
*   **Slim Base Image**: We use `python:3.11-slim` (~120MB) instead of the full `python:3.11` (~900MB).
*   **Layer Cleanup**: We run `rm -rf /var/lib/apt/lists/*` after installing system dependencies to delete temporary install files.
*   **.dockerignore**: We exclude large folders like `.venv`, `__pycache__`, and `tests` from being copied into the image.

---

## 🛠️ Common Commands

| Action | Command |
| :--- | :--- |
| **Build & Run** | `docker-compose up --build` |
| **Run in Background** | `docker-compose up -d` |
| **View Logs** | `docker-compose logs -f` |
| **Interactive Shell** | `docker exec -it smart-streetlight-backend sh` |
| **Check Storage Use** | `docker system df` |

---

## ⚠️ Important Note
If you are using **volumes** for local database storage (not Supabase), remember that `docker-compose down` does NOT delete volumes. To delete volume data as well, use:
```bash
docker-compose down -v
```
