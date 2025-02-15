const { authorize } = require('../../middleware/authMiddleware');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn(() => mockRes)
    };
    nextFunction = jest.fn();
  });

  it.concurrent('should add user object to request with client role', () => {
    const middleware = authorize('client');
    middleware(mockReq, mockRes, nextFunction);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.role).toBe('client');
    expect(mockReq.user.id).toBe('123456789');
    expect(mockReq.user.email).toBe('test@example.com');
    expect(nextFunction).toHaveBeenCalled();
  });

  it.concurrent('should add user object to request with coach role', () => {
    const middleware = authorize('coach');
    middleware(mockReq, mockRes, nextFunction);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.role).toBe('coach');
    expect(nextFunction).toHaveBeenCalled();
  });

  it.concurrent('should add user object to request with admin role', () => {
    const middleware = authorize('admin');
    middleware(mockReq, mockRes, nextFunction);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.role).toBe('admin');
    expect(nextFunction).toHaveBeenCalled();
  });

  it.concurrent('should return 403 if role does not match', () => {
    const middleware = authorize('admin');
    mockReq.user = { role: 'client' };
    
    middleware(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
}); 