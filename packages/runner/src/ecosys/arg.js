function _readArg(long, short = '') {
  const fargs = _readArgs(long, short);
  return fargs.length ? fargs[0] : undefined;
}

function _readArgs(long, short = '') {
  let longArg = argv[long];
  let shortArg = argv[short];
  if (typeof longArg === 'string' || typeof longArg === 'boolean') {
    longArg = [longArg];
  }
  if (typeof shortArg === 'string' || typeof shortArg === 'boolean') {
    shortArg = [shortArg];
  }
  longArg = longArg ?? [];
  shortArg = shortArg ?? [];
  return [...longArg, ...shortArg];
}

export function programArguments() {
  return argv._;
}

export function option(long, short) {
  return _readArg(long, short);
}

export function options(long, short) {
  return _readArgs(long, short);
}

export function isDebug() {
  return option('debug');
}

export function datadir() {
  return option('datadir', 'd');
}

export function datapath(file) {
  return `${datadir()}${file}`
}

