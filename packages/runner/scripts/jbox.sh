#!/bin/sh
#

set -e

BIN_PATH=$(cd "$(dirname "$0")"; pwd -P)
WORK_PATH=${BIN_PATH}/../

zx ${WORK_PATH}/src/index.mjs ${@}
