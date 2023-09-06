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

### Oracle relay

Run oracle relay, you should deploy your oracle contract, and deploy
your indexer to index your contract events.

References:

- [How to deploy oracle contract](./)
- [How to deploy ormpipe indexer](./)

Ready for these, next, you can execute ormpipe to run oracle relay.

```bash
ormpipe start \
  --tasks=oracle \
  --source-name=arbitrum-goerli \
  --target-name=pangolin \
  --source-endpoint=https://endpoints.omniatech.io/v1/arbitrum/goerli/public \
  --target-endpoint=https://pangolin-rpc.darwinia.network \
  --source-indexer-oracle-endpoint=https://api.studio.thegraph.com/query/51152/ormpipe-arbitrum-goerli/version/latest \
  --source-indexer-ormp-endpoint=https://api.studio.thegraph.com/query/51152/ormpipe-arbitrum-goerli/version/latest \
  --target-indexer-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-pangolin \
  --source-address-airnode=0xa681492DBAd5a3999cFCE2d72196d5784dd08D0c \
  --target-address-airnode=0x770713580e5c618A4D29D7E8c0d7604276B63832 \
  --source-signer-airnode \
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

**airnode contract address**

`--source-address-airnode` and `--target-address-airnode` source chain and
target chain deployed airnode contract address

> deployed airnode contract address you can
> check
> there [airnode-dapi](https://github.com/darwinia-oracle-dao/airnode-dapi/blob/main/bin/addr.json)

**signer**

`--source-signer-airnode` and `--target-signer` your account private key in
source and target chain or use env `ORMPIPE_SOURCE_SIGNER_AIRNODE` and `ORMPIPE_TARGET_SIGNER`

> you can use `*-signer-airnode` or `*-signer` these are
> same, `*-signer-airnode` has higher priority

**enable**

`--enable-source-to-target` and `--enable-target-to-source` enable relay
direction.

### Realyer relay

Run relayer relay, you should deploy you relayer contract, and deploy your relayer contract indexer.

References:

- [How to deploy relayer contract](./)
- [How to deploy ormpipe indexer](./)

Ready for these, next, you can execute ormpipe to run relayer relay.

```bash
ormpipe start \
  --tasks=relayer \
  --source-name=arbitrum-goerli \
  --target-name=pangolin \
  --source-endpoint=https://endpoints.omniatech.io/v1/arbitrum/goerli/public \
  --target-endpoint=https://pangolin-rpc.darwinia.network \
  --source-indexer-relayer-endpoint=https://api.studio.thegraph.com/query/51152/ormpipe-arbitrum-goerli/version/latest \
  --source-indexer-ormp-endpoint=https://api.studio.thegraph.com/query/51152/ormpipe-arbitrum-goerli/version/latest \
  --target-indexer-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-pangolin \
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

`--source-signer-airnode` and `--target-signer` your account private key in
source and target chain or use env `ORMPIPE_SOURCE_SIGNER_AIRNODE` and `ORMPIPE_TARGET_SIGNER`

> you can use `*-signer-airnode` or `*-signer` these are
> same, `*-signer-airnode` has higher priority

**enable**

`--enable-source-to-target` and `--enable-target-to-source` enable relay
direction.

