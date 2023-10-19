import * as enquirer from "enquirer";
import {logger} from "@darwinia/ormpipe-logger";


export class CommandHelper {

  public static async interactiveValue(options: {
    required: boolean,
    enable: boolean,
    type?: string,
    name: string,
    message?: string,
    title: string,
    default?: string,
  }): Promise<string | undefined> {
    let value = options.default;

    if (options.enable) {
      const response: { field: string } = await enquirer.prompt({
        type: options.type ?? 'input',
        name: 'field',
        message: options.title,
        validate: async input => {
          if (!input) return options.title;
          return true;
        }
      });
      if (response.field) {
        value = response.field;
      }
    }

    if (!value && options.required) {
      logger.error(options.message ?? `missing ${options.name}`);
      process.exit(1);
    }
    return value;
  }
}

