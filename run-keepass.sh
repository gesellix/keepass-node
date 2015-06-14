#!/bin/bash

useradd keepass --home /keepass
chown -R keepass:keepass /keepass

su keepass -c "cd /keepass && npm start"
