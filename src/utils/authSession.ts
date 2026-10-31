export class BackendSessionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'BackendSessionError';
  }
}

export async function createBackendSession(accessToken: string): Promise<string> {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new BackendSessionError(data.error || 'No se pudo iniciar la sesión de la agenda.', response.status);
  }
  return String(data.email || '');
}
