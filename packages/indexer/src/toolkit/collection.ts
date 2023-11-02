export class CollectionKit {
  public static parts<T>(array: T[], part = 1): T[][] {
    const rets = [];
    const length = array.length;
    const size = Math.floor(length / part);
    let start = 0, end = size;
    let times = 0;
    for (; start < length;) {
      times += 1;
      const items = array.slice(start, end);
      if (times === part && start < length) {
        items.push(...array.slice(end, length));
        rets.push(items);
        break;
      }
      rets.push(items);
      start = end;
      end += size;
    }
    return rets;
  }

  public static split<T>(array: T[], size = 10): T[][] {
    const rets = [];
    const length = array.length;
    let start = 0, end = size;
    for (; start < length;) {
      rets.push(array.slice(start, end));
      start = end;
      end += size;
    }
    return rets;
  }

}
