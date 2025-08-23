#!/bin/bash

if [[ "$1" == "--reset" ]]; then
  dfx stop || true
  ./build-and-deploy.sh
else
  dfx deploy sudao_be_explorer
fi
