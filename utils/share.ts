export function generateShareLink(inviteCode: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://telodije.app';
  return `${baseUrl}/join?code=${inviteCode}`;
}

export function getShareMessage(
  quinielaName: string,
  inviteCode: string
): string {
  return `¡Únete a mi apuesta "${quinielaName}" en Telodije! 🏆\n\nUsa el código: ${inviteCode}\nO haz clic en el enlace:`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  return Promise.resolve();
}

export async function shareContent(title: string, text: string, url: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }
  
  // Fallback: copy to clipboard
  await copyToClipboard(`${text}\n${url}`);
  return true;
}
