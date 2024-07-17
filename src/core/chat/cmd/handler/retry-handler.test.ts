import { Chat } from '@core/chat';
import { ExitHandler } from '@core/chat/cmd/handler/exit-handler';
import { RetryHandler } from '@core/chat/cmd/handler/retry-handler';

const mockContext = () => {
  return {
    retry: jest.fn(),
  };
}

describe("retry handler", () => {
  it ("should call retry", async () => {
    const context = mockContext();
    const handler = new RetryHandler();
    await handler.handle("", context);
    expect(context.retry).toHaveBeenCalled();
  })
})