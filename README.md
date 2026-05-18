## .env keys

Currently, `.env` file looks like this

```
LLM_API_KEY=set_this
JWT_SECRET=jwt_set_here
```

## Backend container info

If you try to start container without creating `database.db` file, you will get a directory created by Docker. It is recommended to create this file before startup of container image. 

## Frontend container development

To start frontend container development, do this:

```bash
docker run --rm -it -v ${pwd}:/app oven/bun:1 sh -c "
   cd /app && bun create vite@latest frontend -- --template react-ts
   bun add -d @tailwindcss/vite tailwindcss @tanstack/router-plugin
"
```
After preparation you can easily start frontend-dev section:
```bash
docker-compose up frontend-dev backend
```
Now, you can develop frontend with backend using React+Vite.