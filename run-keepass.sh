#!/bin/sh

adduser -h /keepass -D keepass
chown -R keepass:keepass /keepass

su keepass -c "cd /keepass && npm start"
