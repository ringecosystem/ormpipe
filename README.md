# Ormpipe

Ormpipe is ORMP relay program
for [Ormp](https://github.com/darwinia-network/ormp).

## Usage

The first step is install ormpipe. you can use npm to install it.

```bash
npm i -g @darwinia/ormpipe-cli
```

Update ormpipe please run

```bash
npm update -g @darwinia/ormpipe-cli
```

if you like use docker you can
see [ormpile docker registry](https://github.com/darwinia-network/ormpipe/pkgs/container/ormpipe)
to get new version.

```bash
docker run -it --name=ormpipe \
  ghcr.io/darwinia-network/ormpipe:sha-277b2e6 \
  --help
```

Ormpipe have two roles named `oracle` and `relayer`, the `oracle` role do sign
message and import message root (after execute multisig), the `relayer` role
relay message.

## Run

### Oracle

Oracle role works is sign message and submit multisig (only mainly node submit
to multisig contract).

**IMPORT**

> 1. All signed message will submit to Darwinia `submittion` contract, so you
     should have some `RING` to pay fees.
> 2. If you run mainly node, you should have target chain token to pay fees.

```bash
ormpipe oracle \
  --enable-pair=sepolia-pangolin \
  --enable-pair=arbitrumsepolia-pangolin
```

If you want to run mainly node, please add `--mainly` to your command.

```bash
ormpipe oracle \
  --enable-pair=sepolia-pangolin \
  --enable-pair=arbitrumsepolia-pangolin \
  --mainly
```

### Relayer

Run realyer node you can follow this command

```bash
ormpipe relayer \
  --enable-pair=sepolia-pangolin \
  --enable-pair=arbitrumsepolia-pangolin
```

## Advance

### Pairs

Ormpipe support chains

**Testnets**

| -               | pangolin | sepolia | arbitrumsepolia |
|-----------------|----------|---------|-----------------|
| pangolin        | n        | y       | y               |
| sepolia         | y        | n       | y               |
| arbitrumsepolia | y        | y       | n               |

**Mainnet**

| -        | darwinia | crab | ethereum | arbitrum | polygon |
|----------|----------|------|----------|----------|---------|
| darwinia | n        | y    | y        | y        | y       |
| crab     | y        | n    | n        | n        | n       |
| ethereum | y        | n    | n        | y        | n       |
| arbitrum | y        | n    | y        | n        | n       |
| polygon  | y        | n    | n        | n        | n       |

### Private key

Default Ormpipe program will ask you typing your private key, because this is
safety, Ormpipe also supports reading from environment variables, if you are
willing to do so.

```bash
export ORMPIPE_SIGNER=0x123456
```

> TIPS:
> You can set different account for different chain
> ```bash
> export ORMPIPE_SIGNER=0x123456
> export ORMPIPE_SIGNER_PANGOLIN=0x654321
> ```

### Docker

If you want run Ormpipe use docker, you can follow this command

```bash
docker run -it --name=ormpipe \
  -e ORMPIPE_SIGNER=0x1234 \
  ghcr.io/darwinia-network/ormpipe:sha-277b2e6 \
    oracle \
    --enable-pair=pangolin-sepolia
```

Best practice is to use docker compose.

```bash
version: "3"

services:
  ormpipe-testnets-oracle:
    container_name: ormpipe-testnets-oracle
    image: ghcr.io/darwinia-network/ormpipe:sha-277b2e6
    restart: always
    environment:
      ORMPIPE_SIGNER: 0x123457
    command:
      - oracle
      - --enable-pair=sepolia-pangolin
      - --enable-pair=arbitrumsepolia-pangolin
      - --enable-pair=sepolia-arbitrumsepolia
```

then run `docker compose up -d` to start program.

