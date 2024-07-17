import { Chat } from '@core/chat';
import { LoadHandler } from '@core/chat/cmd/handler/load-handler';
import path from 'path';
import env from '@env';
import { SaveHandler } from '@core/chat/cmd/handler/save-handler';
import { UndoHandler } from '@core/chat/cmd/handler/undo-handler';

const mockContext = () => {
  return {
    chat: {
      undo: jest.fn()
    } as unknown as jest.Mocked<Chat>,
    print: jest.fn(),
  };
}


describe("undo handler", () => {
  it ("should undo with no args", async () => {
    const context = mockContext();
    const handler = new UndoHandler();
    await handler.handle("", context);
    expect(context.chat.undo).toBeCalledWith(2)
  })

  it ("should undo with args", async () => {
    const context = mockContext();
    const handler = new UndoHandler();
    await handler.handle("4", context);
    expect(context.chat.undo).toBeCalledWith(4)
  })
})