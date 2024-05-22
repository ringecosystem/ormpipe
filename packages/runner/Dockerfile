FROM docker:26.1.3-cli-alpine3.19 as docker

FROM node:21-alpine

COPY --from=docker /usr/local/bin/docker /usr/local/bin

COPY . /app
RUN apk update \
    && apk add bash \
    && npm config set update-notifier false \
    && npm i -g zx \
    && cd /app \
    && npm i

ENTRYPOINT ["/app/scripts/runner.sh"]
