export interface MessageTemplate {
  type: 'reminder' | 'thankyou' | 'overdue';
  customerName: string;
  amount: number;
  shopName?: string;
  daysOverdue?: number;
}

export function normalizeEthiopianPhone(phone: string): string {
  if (!phone || phone.trim() === '') {
    return '';
  }
  
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('251')) {
    cleaned = cleaned.slice(3);
  }
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+251${cleaned}`;
  }
  
  if (cleaned.length < 9) {
    return '';
  }
  
  return `+251${cleaned}`;
}

export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const normalized = normalizeEthiopianPhone(phone);
  return normalized.length >= 13;
}

export function getPhoneForTelegram(phone: string): string {
  const normalized = normalizeEthiopianPhone(phone);
  return normalized.replace('+', '');
}

export function generateReminderMessage(template: MessageTemplate): string {
  const shopName = template.shopName || localStorage.getItem('shopName') || 'Our Shop';
  const telebirr = localStorage.getItem('telebirr') || '';
  const cbe = localStorage.getItem('cbe') || '';
  
  let paymentInfo = '';
  if (telebirr) {
    paymentInfo += `\nTelebirr: ${telebirr}`;
  }
  if (cbe) {
    paymentInfo += `\nCBE: ${cbe}`;
  }
  
  switch (template.type) {
    case 'reminder':
      return `ሰላም ${template.customerName}!\n\n` +
        `ከ${shopName} ጋር ${template.amount.toLocaleString()} ብር ብድር አለብዎት።\n\n` +
        `እባክዎን በተመቸዎት ጊዜ ይክፈሉን።${paymentInfo}\n\n` +
        `አመሰግናለሁ! 🙏`;
        
    case 'overdue':
      return `ሰላም ${template.customerName}!\n\n` +
        `⚠️ ይሄ አስቸኳይ ማስታወቂያ ነው!\n\n` +
        `${template.amount.toLocaleString()} ብር ብድር ለ${template.daysOverdue || 7}+ ቀናት አልተከፈለም።\n\n` +
        `ከ${shopName}${paymentInfo}\n\n` +
        `ዛሬ ይክፈሉን! 🙏`;
        
    case 'thankyou':
      return `ሰላም ${template.customerName}!\n\n` +
        `ክፍያዎን አመሰግናለሁ! ✅\n\n` +
        `እናመሰግናለን ከ${shopName} ጋር ለሆኑ!\n\n` +
        `እንደገና ይምጡ! 🛍️`;
        
    default:
      return `ሰላም ${template.customerName}! ${template.amount.toLocaleString()} ብር ብድር አለብዎት።`;
  }
}

export function openSMS(phone: string, message: string): void {
  const normalized = normalizeEthiopianPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  
  window.location.href = `sms:${normalized}${separator}body=${encodedMessage}`;
}

export function openTelegram(phone: string, message: string): void {
  const telegramPhone = getPhoneForTelegram(phone);
  const encodedMessage = encodeURIComponent(message);
  
  const telegramUrl = `https://t.me/${telegramPhone}`;
  
  const newWindow = window.open(telegramUrl, '_blank');
  
  if (newWindow) {
    setTimeout(() => {
      navigator.clipboard?.writeText(message).catch(() => {});
    }, 500);
  }
  
  setTimeout(() => {
    window.location.href = `tg://msg?text=${encodedMessage}&to=${telegramPhone}`;
  }, 800);
}

export function openWhatsApp(phone: string, message: string): void {
  const normalized = normalizeEthiopianPhone(phone).replace('+', '');
  const encodedMessage = encodeURIComponent(message);
  
  window.open(`https://wa.me/${normalized}?text=${encodedMessage}`, '_blank');
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  }
  
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(true);
  } catch {
    document.body.removeChild(textArea);
    return Promise.resolve(false);
  }
}
