import { Chat } from '@core/chat';
import { LoadHandler } from '@core/chat/cmd/handler/load-handler';
import path from 'path';
import env from '@env';
import { SaveHandler } from '@core/chat/cmd/handler/save-handler';

const mockContext = (rtn: string) => {
  return {
    chat: {
      dehydrate: jest.fn().mockReturnValue("some-mocked-value")
    } as unknown as jest.Mocked<Chat>,
  };
}

const mockIO = () => {
  return {
    write: jest.fn(),
    read: jest.fn()
  }
}

describe("save handler", () => {
  it ("should load last session with no arg", async () => {
    const context = mockContext("some-mocked-value");
    const io = mockIO();
    const handler = new SaveHandler(io);
    await handler.handle("", context);
    expect(io.write).toBeCalledWith(["session", "last_session.json"], "some-mocked-value")
  })

  it ("should save with file name if has arg", async () => {
    const context = mockContext("some-mocked-value");
    const io = mockIO();
    const handler = new SaveHandler(io);
    await handler.handle("000", context);
    expect(io.write).toBeCalledWith(["session", "000.json"], "some-mocked-value")
  })
})