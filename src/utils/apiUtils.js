const runtimeDefaultApiBase = (() => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port !== '5001') {
    return 'http://localhost:5001';
  }

  return '';
})();

const buildUrl = (path) => `${runtimeDefaultApiBase}${path}`;

const readResponseErrorText = async (response) => {
  const text = await response.text();
  if (!text) {
    return `Request failed with status ${response.status}`;
  }

  if (text.includes('<!DOCTYPE html>')) {
    return 'Backend API endpoint not found. Please run the Flask backend (uv run python red_green_playground.py).';
  }

  return text;
};

export const postJson = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {})
  });

  if (!response.ok) {
    throw new Error(await readResponseErrorText(response));
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error('Received an invalid JSON response from backend.');
  }
};

export const postNoBody = async (path) => {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(await readResponseErrorText(response));
  }

  return response;
};

