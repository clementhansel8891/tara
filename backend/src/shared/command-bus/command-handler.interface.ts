/**
 * ICommandHandler
 * Generic interface for all command handlers in the Zenvix CommandBus.
 *
 * All command handlers MUST implement this interface.
 * TCommand = the command class (e.g. HireEmployeeCommand)
 * TResult  = the return type of the execute method (default: void)
 */
export interface ICommandHandler<TCommand, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
