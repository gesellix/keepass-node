FROM node:0.10

RUN apt-get update && apt-get install -y libcrypto++-dev

EXPOSE 8443

ENV NODE_ENV production

WORKDIR /keepass/
RUN mkdir -p /keepass/certs && mkdir -p /keepass/local

ADD ./run-keepass.sh /keepass/run-keepass.sh
CMD ["bash", "-c", "/keepass/run-keepass.sh"]

ADD ./package.json /keepass/package.json
RUN npm install --production

ADD ./lib /keepass/lib
ADD ./public /keepass/public
ADD ./README.md /keepass/
ADD ./keepass-node-config.template.js /keepass/
ADD ./server.js /keepass/
