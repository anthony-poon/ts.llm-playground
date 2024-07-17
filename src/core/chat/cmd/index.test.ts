import { CmdHandlerStack } from '@core/chat/cmd/index';
import { Chat } from '@core/chat';
import { TTYInterface } from '@core/stream';

const mockContext = () => {
  return {
    chat: new Chat(),
    exit: jest.fn(),
    print: jest.fn(),
  };
}

const mockHandler = () => {
  return {
    handle: jest.fn()
  }
}

describe("CMD Handler Stack", () => {
  it("should throw if invalid command", async () => {
    const handler = new CmdHandlerStack({
      "/cmd": mockHandler()
    });
    await expect(() => handler.handle("/invalid", mockContext())).rejects.toThrow("Invalid command")
  })

  it("should call relevant cmd if valid command", async () => {
    const cmd1 = mockHandler();
    const cmd2 = mockHandler();
    const handler = new CmdHandlerStack({
      "/cmd1": cmd2,
      "/cmd2": cmd2
    });
    await handler.handle("/cmd2", mockContext())
    expect(cmd1).not.toHaveBeenCalled();
    expect(cmd2).toHaveBeenCalled();
  })
})