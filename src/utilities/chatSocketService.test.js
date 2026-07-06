import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockDisconnect = vi.fn();

const mockSocket = {
  connected: true,
  emit: mockEmit,
  on: mockOn,
  disconnect: mockDisconnect
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket)
}));

vi.mock('../../src/redux/app/store.js', () => ({
  store: {
    dispatch: vi.fn()
  }
}));

import chatSocketService from './chatSocketService.js';
import { io } from 'socket.io-client';
import { store } from '../../src/redux/app/store.js';

describe('ChatSocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatSocketService.disconnect();
  });

  afterEach(() => {
    chatSocketService.disconnect();
  });

  it('should initialize connection properly', () => {
    const user = { clinicId: '123', userName: 'TestUser' };
    chatSocketService.connect('http://test.com', user);

    expect(io).toHaveBeenCalledWith('http://test.com', expect.objectContaining({
      auth: expect.objectContaining({
        clinicId: '123',
        userName: 'TestUser'
      })
    }));
    
    // Ensure event listeners are set
    expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('message:received', expect.any(Function));
  });

  it('should send a message if connected', () => {
    chatSocketService.socket = mockSocket;
    const result = chatSocketService.sendMessage({ text: 'Hello' });
    
    expect(result).toBe(true);
    expect(mockEmit).toHaveBeenCalledWith('message:send', { text: 'Hello' });
  });

  it('should not send a message if disconnected', () => {
    chatSocketService.socket = { ...mockSocket, connected: false };
    const result = chatSocketService.sendMessage({ text: 'Hello' });
    
    expect(result).toBe(false);
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should emit typing status', () => {
    chatSocketService.socket = mockSocket;
    
    chatSocketService.emitTyping(true);
    expect(mockEmit).toHaveBeenCalledWith('typing:start');
    
    chatSocketService.emitTyping(false);
    expect(mockEmit).toHaveBeenCalledWith('typing:stop');
  });

  it('should handle disconnect', () => {
    chatSocketService.socket = mockSocket;
    chatSocketService.disconnect();
    
    expect(mockDisconnect).toHaveBeenCalled();
    expect(chatSocketService.socket).toBeNull();
    expect(chatSocketService.getConnectionStatus()).toBe(false);
  });
});
