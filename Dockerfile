FROM node:6.11.1-alpine

EXPOSE 8443
ENV PORT 8443

ENV NODE_ENV production

WORKDIR /keepass/

COPY ./README.md /keepass/README.md
COPY ./package.json /keepass/package.json

RUN apk add -U --virtual build-deps build-base python \
    && npm install --production \
    && apk del build-deps \
    && mkdir -p /keepass/certs && mkdir -p /keepass/local

COPY ./run-keepass.sh /keepass/run-keepass.sh
CMD ["sh", "-c", "/keepass/run-keepass.sh"]

COPY ./lib /keepass/lib
COPY ./public /keepass/public
COPY ./keepass-node-config.template.js /keepass/keepass-node-config.template.js
COPY ./server.js /keepass/server.js
