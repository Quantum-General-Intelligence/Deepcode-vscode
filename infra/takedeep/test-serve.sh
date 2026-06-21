#!/bin/bash
source /opt/takedeep/.env
PID=$(supervisorctl pid takedeep-serve)
echo "serve pid $PID"
tr '\0' '\n' < /proc/$PID/environ | grep KILO_SERVER_PASSWORD
curl -s -o /dev/null -w "noauth:%{http_code} " http://127.0.0.1:4096/
curl -s -o /dev/null -w "auth:%{http_code}\n" -u "kilo:${KILO_SERVER_PASSWORD}" http://127.0.0.1:4096/
curl -s -u "kilo:${KILO_SERVER_PASSWORD}" http://127.0.0.1:4096/ | head -c 120
echo
