import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../context/LanguageContext";

export default function OrderSuccessPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-[var(--app-height)] flex items-center justify-center bg-makmex-surface">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-extrabold text-makmex-text mb-4">
            {t('orderSuccessTitle')}
          </h1>
          
          <p className="text-lg text-makmex-muted mb-8">
            {t('orderSuccessMessage')}
          </p>

          {/* Important Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">{t('whatHappensNext')}</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>• {t('emailConfirmationShortly')}</li>
              <li>• {t('teamReviewOrder')}</li>
              <li>• {t('representativeContactDetails')}</li>
              <li>• {t('deliveryArrangements')}</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="bg-makmex-surface border border-makmex-border rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-makmex-text mb-2">{t('questions')}</h3>
            <p className="text-sm text-makmex-muted">
              {t('questionsAboutOrder')}
            </p>
            <a 
              href="mailto:test@gmail.com" 
              className="text-makmex-orange hover:underline font-medium"
            >
              test@gmail.com
            </a>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-makmex-orange text-black font-semibold py-3 rounded-lg hover:bg-makmex-ember transition-colors"
            >
              {t('continueShopping')}
            </button>
          </div>

          {/* Order Limit Reminder */}
          <p className="text-xs text-makmex-muted mt-6">
            {t('orderLimitReminder')}
          </p>
        </div>
      </div>
    </div>
  );
}
