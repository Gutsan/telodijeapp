export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

export function isMatchStarted(matchDate: string): boolean {
  return new Date(matchDate).getTime() <= Date.now();
}

export function isMatchFinished(status: string): boolean {
  return status === 'finished';
}

export function getMatchStatus(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'Programado';
    case 'live':
      return 'En Vivo';
    case 'finished':
      return 'Finalizado';
    default:
      return status;
  }
}
