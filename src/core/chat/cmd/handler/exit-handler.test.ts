import { Chat } from '@core/chat';
import { ExitHandler } from '@core/chat/cmd/handler/exit-handler';

const mockContext = () => {
  return {
    chat: new Chat(),
    exit: jest.fn(),
    print: jest.fn(),
  };
}

describe("exit handler", () => {
  it ("should call exit", async () => {
    const context = mockContext();
    const handler = new ExitHandler();
    await handler.handle("", context);
    expect(context.exit).toHaveBeenCalled();
  })
})