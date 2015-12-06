FROM node:4

RUN apt-get update && apt-get install -y libcrypto++-dev

EXPOSE 8443
ENV PORT 8443

ENV NODE_ENV production

WORKDIR /keepass/
RUN mkdir -p /keepass/certs && mkdir -p /keepass/local

COPY ./run-keepass.sh /keepass/run-keepass.sh
CMD ["bash", "-c", "/keepass/run-keepass.sh"]

COPY ./README.md /keepass/README.md
COPY ./package.json /keepass/package.json
RUN npm install --production

COPY ./lib /keepass/lib
COPY ./public /keepass/public
COPY ./keepass-node-config.template.js /keepass/keepass-node-config.template.js
COPY ./server.js /keepass/server.js
