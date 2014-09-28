FROM node:0.10

RUN apt-get update && apt-get install -y libcrypto++-dev

RUN mkdir -p /opt/keepass/{certs,local}

ADD ./package.json /opt/keepass/package.json
RUN cd /opt/keepass && npm install

ADD ./public /opt/keepass/
ADD ./README.md /opt/keepass/
ADD ./google-drive.js /opt/keepass/
ADD ./keepass-node-config.template.js /opt/keepass/
ADD ./server.js /opt/keepass/

WORKDIR /opt/keepass

# using the volumes with a dedicated data container:
#  docker run -d -v /opt/ghost/content/data -v /opt/ghost/content/images --name ghost-data ubuntu:14.04 true
#  docker run -d --volumes-from ghost-data -v `pwd`/config.js:/opt/ghost/config.js -p 2368:2368 gesellix/gesellix.net

# create a data container backup:
#  docker run --volumes-from ghost-data -v `pwd`:/backup ubuntu:14.04 tar cfvz /backup/ghost-data.tgz /opt/ghost/content/data
#  docker run --volumes-from ghost-data -v `pwd`:/backup ubuntu:14.04 tar cfvz /backup/ghost-images.tgz /opt/ghost/content/images

# restore a container backup:
#  docker run --volumes-from ghost-data -v `pwd`:/backup ubuntu:14.04 tar xfvz /backup/ghost-data.tgz
#  docker run --volumes-from ghost-data -v `pwd`:/backup ubuntu:14.04 tar xfvz /backup/ghost-images.tgz

EXPOSE 443

CMD ["npm", "start"]
