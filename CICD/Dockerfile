FROM harbor.agioema.com/base-images/nginx:1.27.4-alpine-slim

WORKDIR /usr/share/nginx/html/

ENV TZ=Asia/Shanghai

COPY dist /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
