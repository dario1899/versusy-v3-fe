export async function fetchMockCredentials() {
  // Simulate backend latency and a JSON response payload
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    login: 'demo',
    password: 'demo'
  };
}

