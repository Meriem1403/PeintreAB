FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# npm install au démarrage : sécurise le NAS si l’image / le volume était obsolète
CMD ["sh", "-c", "npm install && sleep 2 && npm run migrate && npm run dev"]
