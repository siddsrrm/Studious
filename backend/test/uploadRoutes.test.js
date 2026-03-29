const request = require('supertest');
const express = require('express');

jest.mock('../middleware/authMiddleware', () => {
  // auth middleware stub: always authenticate
  return (req, res, next) => {
    req.user = { userId: 'test-user' };
    next();
  };
});

// Mock pdf-parse so we don't need real PDFs in tests
jest.mock('pdf-parse', () => jest.fn(async () => ({ text: 'Hello from PDF', numpages: 3 })));

describe('uploadRoutes', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();

    // Mock fetch for the Ollama call
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        message: {
          content: 'Generated Title\n\n- Bullet 1\n- Bullet 2',
        },
      }),
      text: async () => '',
      status: 200,
    }));

    process.env.OLLAMA_URL = 'http://localhost:11434/api/chat';
    process.env.OLLAMA_MODEL = 'llama3.2';

    const uploadRoutes = require('../routes/uploadRoutes');

    app = express();
    app.use(express.json());
    app.use('/api/upload', uploadRoutes);
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('POST /api/upload/pdf returns extracted text + pageCount', async () => {
    const res = await request(app)
      .post('/api/upload/pdf')
      .attach('file', Buffer.from('%PDF-1.4 fake'), {
        filename: 'slides.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      fileName: 'slides.pdf',
      pageCount: 3,
      text: 'Hello from PDF',
    });
  });

  test('POST /api/upload/pdf rejects non-pdf', async () => {
    const res = await request(app)
      .post('/api/upload/pdf')
      .attach('file', Buffer.from('not a pdf'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /api/upload/generate-note calls Ollama and returns title/content', async () => {
    const res = await request(app)
      .post('/api/upload/generate-note')
      .send({ text: 'Some extracted text' });

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalled();
    expect(res.body.title).toBe('Generated Title');
    expect(res.body.content).toContain('- Bullet 1');
  });

  test('POST /api/upload/generate-note returns 400 when missing text', async () => {
    const res = await request(app)
      .post('/api/upload/generate-note')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Missing text to summarize' });
  });
});
