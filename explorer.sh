#!/bin/bash

if [[ "$1" == "--reset" ]]; then
  dfx stop
  ./build-and-deploy.sh
else
  dfx deploy sudao_be_explorer
fi
