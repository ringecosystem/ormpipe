import {setTimeout} from "timers/promises";
import { sha1 } from 'js-sha1';
import * as arg from './ecosys/arg.js'

if (arg.option('verbose')) {
  $.verbose = true;
}

async function _profile() {
  const profile = arg.option('profile');
  const resp = await fetch(`https://raw.githubusercontent.com/msgport/autoconf/main/ormpipe/runner-${profile}.yml`);
  if (resp.status !== 200) {
    console.log(chalk.red(`can not read profile ${profile}`));
    process.exit(1);
  }
  const body = await resp.text();
  const hash = sha1(body)
  return {
    name: profile,
    hash: hash,
    payload: YAML.parse(body),
  };
}

function _extractEnvs() {
  return Object.fromEntries(Object.entries($.env).filter(([k, v]) => k.startsWith('ORMPIPE_')));
}

async function _start(name, profile) {
  const envs = _extractEnvs();

  const ormpipeImageInfo = profile.ormpipe;
  const {features, pairs} = ormpipeImageInfo;

  for (const feature of features) {
    const containerName = `ormpipe-${feature}-${name}`;

    const runContainersOutput = await $`docker ps -a --format '{{.Names}}'`.quiet();
    const rcs = runContainersOutput.stdout.split('\n').filter(item => item);
    if (rcs.filter(rc => rc === containerName).length) {
      await $`docker stop ${containerName}`;
      await $`docker rm ${containerName}`;
    }

    await $`docker pull ${ormpipeImageInfo.image}`;

    const flags = [
      '-dit',
      `--name=${containerName}`,
      ...Object.entries(envs).map(([k, v]) => `--env=${k}=${v}`),
      ormpipeImageInfo.image,
      feature,
      ...pairs.map(item => `--enable-pair=${item}`),
    ]

    await $`docker run ${flags}`.quiet();
    console.log(`-> ormpipe ${chalk.green(containerName)} started with ${chalk.yellow(pairs)}`);
  }

}

async function main() {
  const lifecycle = {};
  while (true) {
    const {name, hash, payload} = await _profile();
    if (lifecycle.profileHash === hash) {
      console.log('profile hash not changed');
      await setTimeout(10000);
      continue
    }
    lifecycle.profileHash = hash;
    console.log('profile changed restart ormpipe program');
    await _start(name, payload);
    await setTimeout(1000);
  }
}

await main();
