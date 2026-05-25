# Procceed to master branch - Full project there

## .env keys

Currently, `.env` file looks like this

```
LLM_API_KEY=set_this
JWT_SECRET=jwt_set_here
```

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
