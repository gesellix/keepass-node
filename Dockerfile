FROM gesellix/node

RUN mkdir -p /opt/keepass-node

ADD ./package.json /opt/keepass-node/package.json
RUN cd /opt/keepass-node && /opt/node/bin/npm install

ADD ./local /opt/keepass-node/
ADD ./public /opt/keepass-node/
ADD ./README.md /opt/keepass-node/
ADD ./google-drive.js /opt/keepass-node/
ADD ./keepass-node-config.template.js /opt/keepass-node/
ADD ./server.js /opt/keepass-node/

WORKDIR /opt/keepass-node

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

CMD ["/opt/node/bin/npm", "start"]
