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

If you want run oracle relay, you should deploy your oracle contract, and deploy
your indexer to index your contract events.

Reference:

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
  --target-indexer-endpoint=https://thegraph-g2.darwinia.network/ormpipe/subgraphs/name/ormpipe-pangolin \
  --source-address-airnode=0xa681492DBAd5a3999cFCE2d72196d5784dd08D0c \
  --target-address-airnode=0x770713580e5c618A4D29D7E8c0d7604276B63832 \
  --source-signer-airnode \
  --target-signer \
  --enable-source-to-target \
  --enable-target-to-source
```

**--tasks**
`--tasks` or `-t` start task name, type `oracle`

- `--source-name` and `--target-name` source chain and target chain name
- `--source-endpoint` and `--target-endpoint` source chain and target chain
  endpoint
- `--source-indexer-oracle-endpoint` and `--target-indexer-endpoint` source
  chain and target chan oracle contract indexer.
- `--source-address-airnode` and `--target-address-airnode` source chain and
  target chain deployed airnode contract address
- `--source-signer-airnode` and `--target-signer` your account private key in
  source and target chain
- `--enable-source-to-target` and `--enable-target-to-source` enable relay
  direction.

### Realyer relay
