import { Chat } from '@core/chat';
import { LoadHandler } from '@core/chat/cmd/handler/load-handler';
import path from 'path';
import env from '@env';

const mockContext = () => {
  return {
    chat: {
      hydrate: jest.fn()
    } as unknown as jest.Mocked<Chat>,
    print: jest.fn(),
  };
}

const mockIO = (rtn: string) => {
  return {
    write: jest.fn(),
    read: jest.fn().mockReturnValue(rtn)
  }
}

describe("load handler", () => {
  it ("should load last session with no arg", async () => {
    const context = mockContext();
    const io = mockIO("some-mocked-value");
    const handler = new LoadHandler(io);
    await handler.handle("", context);
    const fullPath = path.join(env.PATH_TO_VAR, "session", "last_session.json")
    expect(io.read).toBeCalledWith(fullPath)
    expect(context.chat.hydrate).toBeCalledWith("some-mocked-value");
    expect(context.print).toHaveBeenCalled();
  })

  it ("should load file with name if args is provided", async () => {
    const context = mockContext();
    const io = mockIO("some-mocked-value");
    const handler = new LoadHandler(io);
    await handler.handle("000", context);
    const fullPath = path.join(env.PATH_TO_VAR, "session", "000.json")
    expect(io.read).toBeCalledWith(fullPath)
    expect(context.chat.hydrate).toBeCalledWith("some-mocked-value");
    expect(context.print).toHaveBeenCalled();
  })
})