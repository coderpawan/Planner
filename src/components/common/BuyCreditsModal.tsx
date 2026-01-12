'use client';

import { useState } from 'react';
import { MdClose } from 'react-icons/md';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const creditOptions = [
  { credits: 5, price: 5 },
  { credits: 10, price: 10 },
  { credits: 20, price: 20 },
];

export default function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleProceedToPay = () => {
    let finalAmount: number;
    
    if (selectedOption !== null) {
      finalAmount = selectedOption;
    } else if (customAmount) {
      const amount = parseInt(customAmount, 10);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (amount % 5 !== 0) {
        setError('Amount must be a multiple of 5');
        return;
      }
      finalAmount = amount;
    } else {
      setError('Please select or enter an amount');
      return;
    }

    // Log the transaction details (no actual payment integration)
    console.log('🔹 Buy Credits Request:', {
      credits: finalAmount,
      amount: `₹${finalAmount}`,
      timestamp: new Date().toISOString(),
    });

    // Show success message
    alert(`Payment of ₹${finalAmount} for ${finalAmount} credits initiated!\n\n(This is a demo - no actual payment is processed)`);
    
    // Reset and close
    setSelectedOption(null);
    setCustomAmount('');
    setError('');
    onClose();
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedOption(null);
    setError('');
  };

  const handleOptionSelect = (price: number) => {
    setSelectedOption(price);
    setCustomAmount('');
    setError('');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Buy Credits</h2>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl">
            <p className="text-center text-gray-700">
              <span className="font-bold text-pink-600">1 credit = ₹1</span>
              <br />
              <span className="text-sm">Credits can be purchased in multiples of 5</span>
            </p>
          </div>

          {/* Predefined Options */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Select Amount</p>
            <div className="grid grid-cols-3 gap-3">
              {creditOptions.map((option) => (
                <button
                  key={option.credits}
                  onClick={() => handleOptionSelect(option.price)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedOption === option.price
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300 bg-white'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{option.credits}</p>
                    <p className="text-sm text-gray-600">credits</p>
                    <p className="text-lg font-semibold text-pink-600 mt-1">₹{option.price}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Or enter custom amount (multiple of 5)</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ₹
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter amount"
                min="5"
                step="5"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          {/* Proceed Button */}
          <button
            onClick={handleProceedToPay}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Proceed to Pay
          </button>

          {/* Note */}
          <p className="text-xs text-gray-500 text-center">
            Note: Payment integration is not yet implemented. This is a UI demo only.
          </p>
        </div>
      </div>
    </div>
  );
}
