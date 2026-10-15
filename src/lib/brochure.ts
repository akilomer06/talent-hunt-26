import brochureUrl from '../assets/talent-hunt-official-brochure.jpg';

export { brochureUrl };
export async function downloadBrochure() {
  const response = await fetch(brochureUrl);
  if (!response.ok) throw new Error('Brochure download unavailable');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Talent-Hunt-2K26-brochure.jpg';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}