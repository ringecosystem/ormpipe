import {setTimeout} from "timers/promises";
import {sha1} from 'js-sha1';
import * as arg from './ecosys/arg.js'

if (arg.option('verbose')) {
  $.verbose = true;
}

async function _profile(profile) {
  const resp = await fetch(`https://raw.githubusercontent.com/msgport/autoconf/main/ormpipe/runner-${profile}.yml`);
  if (resp.status !== 200) {
    console.log(chalk.yellow(`can not read profile ${profile}, please add --profile and there is allow profiles https://github.com/msgport/autoconf/tree/main/ormpipe`));
    return null;
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

async function _start(lifecycle) {
  console.log('===== start');
  const _definedEnvs = _extractEnvs();

  for (const profileName of lifecycle.profiles) {

    const profiledSingerEnvName = `ORMPIPE_SIGNER_${profileName.toUpperCase()}`;
    const envs = {
      ..._definedEnvs,
      ORMPIPE_SIGNER: _definedEnvs[profiledSingerEnvName] || _definedEnvs['ORMPIPE_SIGNER'],
    };
    delete envs[profiledSingerEnvName];

    const profile = await _profile(profileName);
    if (!profile) {
      continue;
    }

    if (lifecycle.profileHash[profileName] === profile.hash) {
      console.log('profile hash not changed');
      continue
    }
    lifecycle.profileHash[profileName] = profile.hash;
    console.log(`profile changed restart ormpipe program: [${profileName}]`);

    const ormpipePayloadInfo = profile.payload.ormpipe;
    const {pairs} = ormpipePayloadInfo;

    for (const feature of lifecycle.features) {
      const containerName = `ormpipe-${feature}-${profileName}`;

      const runContainersOutput = await $`docker ps -a --format '{{.Names}}'`.quiet();
      const rcs = runContainersOutput.stdout.split('\n').filter(item => item);
      if (rcs.filter(rc => rc === containerName).length) {
        await $`docker stop ${containerName}`;
        await $`docker rm ${containerName}`;
      }

      await $`docker pull ${ormpipePayloadInfo.image}`;

      const flags = [
        '-dit',
        '--restart=always',
        `--name=${containerName}`,
        ...Object.entries(envs).map(([k, v]) => `--env=${k}=${v}`),
        ormpipePayloadInfo.image,
        feature,
        ...pairs.map(item => `--enable-pair=${item}`),
      ]

      await $`docker run ${flags}`.quiet();
      console.log(`-> ormpipe ${chalk.green(containerName)} started with ${chalk.yellow(pairs)}`);
    }

  }

}

async function _clean(lifecycle) {
  console.log('===== clean');
  const resp = await fetch(`https://raw.githubusercontent.com/msgport/autoconf/main/ormpipe/clean.yml`);
  if (resp.status !== 200) {
    return;
  }
  const body = await resp.text();
  const payload = YAML.parse(body);
  const cleanProfiles = payload.ormpipe?.profiles;
  const {features} = lifecycle;
  for (const profile of cleanProfiles) {
    for (const feature of features) {
      const containerName = `ormpipe-${feature}-${profile}`;
      const runContainersOutput = await $`docker ps -a --format '{{.Names}}'`.quiet();
      const rcs = runContainersOutput.stdout.split('\n').filter(item => item);
      if (rcs.filter(rc => rc === containerName).length) {
        await $`docker stop ${containerName}`;
        await $`docker rm ${containerName}`;
      }
    }
  }
}

async function main() {
  const lifecycle = {
    profiles: arg.options('profile', 'p'),
    features: arg.options('feature', 'f'),
    profileHash: {},
  };
  if (!lifecycle.features.length) {
    console.log(chalk.yellow('[warn]: no features provided, please use --features or -f to set it'))
  }

  while (true) {
    await _start(lifecycle);
    await _clean(lifecycle);
    await setTimeout(1000 * 60 * 2);
  }
}

await main();
