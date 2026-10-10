export function shouldUseMockMode(
  mockSetting = process.env.MOCK_OPENAI,
  apiKey = process.env.OPENAI_API_KEY
) {
  return mockSetting === 'true' || !apiKey
}
