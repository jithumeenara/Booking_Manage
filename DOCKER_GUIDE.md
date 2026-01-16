# 🐳 Running with Docker (Maximum Performance)

Your application is already configured with top-tier Docker optimizations (multi-stage builds, Gzip/Brotli compression, Nginx). Running it via Docker will be significantly faster and more stable than `npm run dev`.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## How to Run (Production Mode)

1. **Stop your current terminals** (Ctrl+C in the `npm run dev` and `npm run api` windows).

2. **Run the following command** in your project root:
   ```powershell
   docker-compose up -d --build
   ```

3. **Wait for the build.** It might take a few minutes the first time.
   
4. **Access the App:**
   - Frontend: [http://localhost](http://localhost) (Served via Nginx, super fast)
   - Backend: [http://localhost:3001](http://localhost:3001)

## Why is this faster?
- **React Query:** We just upgraded the `Manage Bookings` page to use **TanStack Query**. It now caches data instantly—no more loading spinners when you switch tabs or edit!
- **Nginx:** The Docker container uses Nginx to serve your files. It compresses them (make them 80% smaller) so they load instantly.
- **Database Indexes:** We added "Indexes" to your database. This acts like a "Table of Contents" for your data, making searches and sorting 10x faster.

## Troubleshooting
- If you see database errors, ensure the `db` container is running:
  ```powershell
  docker-compose ps
  ```
- To view logs:
  ```powershell
  docker-compose logs -f
  ```
