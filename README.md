# Ormpipe

Ormpipe is message relay program
for [Ormp](https://github.com/darwinia-network/ormp).

![ormpipe structure](./docs/graph/ormpipe-flow-1.drawio.svg)

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
  ghcr.io/darwinia-network/ormpipe:sha-1be114c \
  --help
```

## Oracle relay

Run oracle relay, you should deploy your oracle contract, and deploy
your indexer to index your contract events.

References:

- [How to deploy oracle contract](./)
- [How to deploy ormpipe indexer](./)

Ready for these, next, you can execute ormpipe to run oracle relay.

```bash
ormpipe start \
  --tasks=oracle \
  --source-name=arbitrum-sepolia \
  --target-name=crab \
  --source-endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --target-endpoint=https://crab-rpc.darwinia.network \
  --source-indexer-oracle-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-arbitrum-sepolia \
  --source-indexer-ormp-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-arbitrum-sepolia \
  --target-indexer-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-crab \
  --source-address-subapi=0x00945C032A37454333d7044a52a5A42Aa0f6c608 \
  --target-address-subapi=0x00945C032A37454333d7044a52a5A42Aa0f6c608 \
  --source-signer-subapi \
  --target-signer \
  --enable-source-to-target \
  --enable-target-to-source
```

**tasks**

`--tasks` or `-t` start task name, type `oracle`

**chain name**

`--source-name` and `--target-name` source chain and target chain name

**chain endpoint**

`--source-endpoint` and `--target-endpoint` source chain and target chain
endpoint

**oracle indexer endpoint**

`--source-indexer-oracle-endpoint` and `--target-indexer-oracle-endpoint` source chain
and target chain oracle contract indexer.

> you can use `*-indexer-oracle-endpoint` or `*-indexer-endpoint` these are
> same, `*-indexer-oracle-endpoint` has higher priority

**ormp indexer endpoint**

`--source-indexer-ormp-endpoint` and `--target-indexer-ormp-endpoint` source chain
and target chain ormp contract indexer.

> you can use `*-indexer-ormp-endpoint` or `*-indexer-endpoint` these are
> same, `*-indexer-ormp-endpoint` has higher priority

**subapi contract address**

`--source-address-subapi` and `--target-address-subapi` source chain and
target chain deployed subapi contract address

> deployed subapi contract address you can
> check
> there [subapi-dapi](https://github.com/subapidao/subapi/blob/main/abi/SubAPI.abi)

**signer**

`--source-signer-subapi` and `--target-signer` your account private key in
source and target chain or use env `ORMPIPE_SOURCE_SIGNER_SUBAPI` and `ORMPIPE_TARGET_SIGNER`

> you can use `*-signer-subapi` or `*-signer` these are
> same, `*-signer-subapi` has higher priority

**enable**

`--enable-source-to-target` and `--enable-target-to-source` enable relay
direction.

## Realyer relay

Run relayer relay, you should deploy you relayer contract, and deploy your relayer contract indexer.

References:

- [How to deploy relayer contract](./)
- [How to deploy ormpipe indexer](./)

Ready for these, next, you can execute ormpipe to run relayer relay.

```bash
ormpipe start \
  --tasks=relayer \
  --source-name=arbitrum-sepolia \
  --target-name=crab \
  --source-endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --target-endpoint=https://crab-rpc.darwinia.network \
  --source-indexer-relayer-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-arbitrum-sepolia \
  --source-indexer-ormp-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-arbitrum-sepolia \
  --target-indexer-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-crab \
  --source-address-relayer=0x000000007e24Da6666c773280804d8021E12e13F \
  --target-address-relayer=0x000000007e24Da6666c773280804d8021E12e13F \
  --source-signer-relayer \
  --target-signer \
  --enable-source-to-target \
  --enable-target-to-source
```


**tasks**

`--tasks` or `-t` start task name, type `relayer`

**chain name**

`--source-name` and `--target-name` source chain and target chain name

**chain endpoint**

`--source-endpoint` and `--target-endpoint` source chain and target chain
endpoint

**relayer indexer endpoint**

`--source-indexer-relayer-endpoint` and `--target-indexer-relayer-endpoint` source chain
and target chain relayer contract indexer.

> you can use `*-indexer-relayer-endpoint` or `*-indexer-endpoint` these are
> same, `*-indexer-relayer-endpoint` has higher priority

**ormp indexer endpoint**

`--source-indexer-ormp-endpoint` and `--target-indexer-ormp-endpoint` source chain
and target chain ormp contract indexer.

> you can use `*-indexer-ormp-endpoint` or `*-indexer-endpoint` these are
> same, `*-indexer-ormp-endpoint` has higher priority

**relayer contract address**

`--source-address-relayer` and `--target-address-relayer` source chain and
target chain deployed relayer contract address

**signer**

`--source-signer-subapi` and `--target-signer` your account private key in
source and target chain or use env `ORMPIPE_SOURCE_SIGNER_SUBAPI` and `ORMPIPE_TARGET_SIGNER`

> you can use `*-signer-subapi` or `*-signer` these are
> same, `*-signer-subapi` has higher priority

**enable**

`--enable-source-to-target` and `--enable-target-to-source` enable relay
direction.


## Oracle and Realyer


```bash
ormpipe start \
  --task=oracle relayer \
  --source-name=arbitrum-sepolia \
  --target-name=crab \
  --source-endpoint=https://sepolia-rollup.arbitrum.io/rpc \
  --target-endpoint=https://crab-rpc.darwinia.network \
  --source-indexer-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-arbitrum-sepolia \
  --target-indexer-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-crab \
  --source-address-subapi=0x00945C032A37454333d7044a52a5A42Aa0f6c608 \
  --source-address-relayer=0x007EED6207c9AF3715964Fb7f8B5f44E002a3498 \
  --target-address-subapi=0x00945C032A37454333d7044a52a5A42Aa0f6c608 \
  --target-address-relayer=0x007EED6207c9AF3715964Fb7f8B5f44E002a3498 \
  --source-signer \
  --target-signer \
  --enable-source-to-target \
  --enable-target-to-source
```
