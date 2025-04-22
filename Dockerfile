FROM node:20-alpine as builder
ADD . /build

RUN apk update \
  && apk add --no-cache python3 py3-pip make g++ gcc libc-dev

RUN cd /build \
    && yarn install \
    && npx nx reset \
    && yarn build:all

FROM node:20-alpine
COPY --from=builder /build /app

ENTRYPOINT ["/app/packages/cli/bin/run"]
