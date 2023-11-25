FROM node:lts

USER node
WORKDIR /home/node/app
RUN npm install --save axios --prefix /home/node
RUN npm pkg set 'type'='module'

CMD ["bash"]
