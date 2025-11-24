'use client';

import { Modal } from './modal';
import { Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Pro" size="md">
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unlock Unlimited Access
          </h3>
          {reason && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{reason}</p>
          )}
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Pro Features:
          </h4>
          <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Unlimited section generations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Access to all premium sections
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Priority support
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Advanced customization options
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              // In a real app, this would redirect to a payment page
              alert('Payment integration coming soon!');
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </Modal>
  );
}

