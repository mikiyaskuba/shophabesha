import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Phone, Copy, Check } from 'lucide-react';
import { Modal } from './Modal';
import { showToast } from './Toast';
import {
  generateReminderMessage,
  openSMS,
  openTelegram,
  openWhatsApp,
  copyToClipboard,
  type MessageTemplate,
} from '../lib/messaging';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    name: string;
    phone: string;
    amount: number;
    daysOverdue?: number;
  };
}

export function MessageModal({ isOpen, onClose, customer }: MessageModalProps) {
  const [messageType, setMessageType] = useState<'reminder' | 'overdue' | 'thankyou'>('reminder');
  const [copied, setCopied] = useState(false);

  const template: MessageTemplate = {
    type: messageType,
    customerName: customer.name,
    amount: customer.amount,
    daysOverdue: customer.daysOverdue,
  };

  const message = generateReminderMessage(template);

  const handleCopy = async () => {
    const success = await copyToClipboard(message);
    if (success) {
      setCopied(true);
      showToast('Message copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSMS = () => {
    openSMS(customer.phone, message);
    showToast('Opening SMS...', 'info');
    onClose();
  };

  const handleTelegram = () => {
    openTelegram(customer.phone, message);
    showToast('Opening Telegram...', 'info');
    onClose();
  };

  const handleWhatsApp = () => {
    openWhatsApp(customer.phone, message);
    showToast('Opening WhatsApp...', 'info');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Reminder" size="md">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['reminder', 'overdue', 'thankyou'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMessageType(type)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${
                messageType === type
                  ? 'bg-accent text-white'
                  : 'bg-surface text-gray-400 hover:text-white'
              }`}
            >
              {type === 'reminder' && 'Reminder'}
              {type === 'overdue' && 'Overdue'}
              {type === 'thankyou' && 'Thank You'}
            </button>
          ))}
        </div>

        <div className="bg-surface/50 rounded-2xl p-4 border border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Message Preview</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-white whitespace-pre-line text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTelegram}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition"
          >
            <MessageCircle size={28} className="text-white" />
            <span className="text-white text-sm font-medium">Telegram</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-600 hover:bg-green-700 transition"
          >
            <Phone size={28} className="text-white" />
            <span className="text-white text-sm font-medium">WhatsApp</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSMS}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-accent hover:bg-accent/80 transition"
          >
            <Send size={28} className="text-white" />
            <span className="text-white text-sm font-medium">SMS</span>
          </motion.button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Tip: Message is copied automatically when you open any app
        </p>
      </div>
    </Modal>
  );
}
