import { Injectable, Logger } from '@nestjs/common';
import { ICommandHandler } from './command-handler.interface';

/**
 * CommandBusService
 * A lightweight in-process command bus.
 * Handlers are registered by command name and resolved on execute().
 *
 * Usage:
 *   commandBus.register('HireEmployeeCommand', hireHandler);
 *   const result = await commandBus.execute<Employee>('HireEmployeeCommand', cmd);
 */
@Injectable()
export class CommandBusService {
  private readonly logger = new Logger(CommandBusService.name);
  private readonly handlers = new Map<string, ICommandHandler<any, any>>();

  /**
   * Register a handler for a command name.
   * This is called during module initialization by each handler.
   */
  register(commandName: string, handler: ICommandHandler<any, any>): void {
    if (this.handlers.has(commandName)) {
      this.logger.warn(`Handler for command '${commandName}' is being overwritten.`);
    }
    this.handlers.set(commandName, handler);
    this.logger.debug(`Registered handler for command: ${commandName}`);
  }

  /**
   * Execute a registered command.
   * Throws if no handler is registered for the command name.
   */
  async execute<TResult = void>(commandName: string, command: object): Promise<TResult> {
    const handler = this.handlers.get(commandName);
    if (!handler) {
      throw new Error(
        `CommandBus: No handler registered for command '${commandName}'. ` +
          `Ensure the handler is registered in its host module.`,
      );
    }
    this.logger.log(`Dispatching command: ${commandName}`);
    const result = await handler.execute(command);
    this.logger.log(`Command completed: ${commandName}`);
    return result as TResult;
  }

  /**
   * List all currently registered command names (useful for debugging).
   */
  listRegistered(): string[] {
    return Array.from(this.handlers.keys());
  }
}
