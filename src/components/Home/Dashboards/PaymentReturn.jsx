import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

const PaymentReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasAlertedRef = useRef(false);

  const [paymentData, setPaymentData] = useState({});

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const data = {};
    for (const [key, value] of searchParams.entries()) {
      data[key] = value;
    }
    setPaymentData(data);

    // Format payment response summary for alert
    const statusMap = {
      '00': 'SUCCESSFUL (00)',
      '11': 'FAILED (11)',
      '22': 'PENDING (22)'
    };

    const statusText = statusMap[data.status] || data.status || 'UNKNOWN';
    const alertMsg = [
      '========================================',
      '💳 FIUU PAYMENT GATEWAY RESPONSE',
      '========================================',
      `Status: ${statusText}`,
      `Order ID: ${data.orderid || 'N/A'}`,
      `Transaction ID: ${data.tranID || 'N/A'}`,
      `Amount: ${data.currency || 'MYR'} ${data.amount || '0.00'}`,
      `Channel: ${data.channel || 'N/A'}`,
      `Payment Date: ${data.paydate || 'N/A'}`,
      data.error_code ? `Error Code: ${data.error_code}` : null,
      data.error_desc ? `Error Description: ${data.error_desc}` : null,
      data.appcode ? `Bank App Code: ${data.appcode}` : null,
      data.skey ? `Signature (skey): ${data.skey}` : null,
      '========================================'
    ].filter(Boolean).join('\n');

    console.group('%c💳 Fiuu Payment Gateway Response', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
    console.table(data);
    console.log('Raw Response Query:', location.search);
    console.groupEnd();

    // Show alert once
    if (!hasAlertedRef.current) {
      hasAlertedRef.current = true;
      setTimeout(() => {
        window.alert(alertMsg);
      }, 300);
    }
  }, [location.search]);

  const isSuccess = paymentData.status === '00';
  const isPending = paymentData.status === '22';
  const isFailed = paymentData.status === '11' || (!isSuccess && !isPending && paymentData.status);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)', padding: '100px 24px 60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: 'var(--color-bg-secondary)',
        borderRadius: '20px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        padding: '36px',
        textAlign: 'center'
      }}>
        {/* Status Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          background: isSuccess ? 'rgba(16, 185, 129, 0.12)' : (isPending ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)')
        }}>
          {isSuccess && <CheckCircle2 size={40} color="#10b981" />}
          {isPending && <AlertTriangle size={40} color="#f59e0b" />}
          {isFailed && <XCircle size={40} color="#ef4444" />}
          {!isSuccess && !isPending && !isFailed && <ShieldCheck size={40} color="var(--color-accent)" />}
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>
          {isSuccess ? 'Payment Successful' : (isPending ? 'Payment Pending' : (isFailed ? 'Payment Failed' : 'Payment Response Received'))}
        </h2>

        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: '0 0 28px 0', lineHeight: 1.5 }}>
          {isSuccess
            ? 'Your payment transaction has been processed and verified by Fiuu.'
            : (isPending
              ? 'Your payment is currently pending confirmation from the payment provider.'
              : (isFailed
                ? (paymentData.error_desc || 'The payment transaction could not be completed.')
                : 'Payment response from Fiuu sandbox gateway.'))}
        </p>

        {/* Transaction Details Box */}
        <div style={{
          background: 'var(--color-bg-main)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '20px',
          marginBottom: '28px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
            <span style={{ fontWeight: 600, color: isSuccess ? '#10b981' : (isPending ? '#f59e0b' : '#ef4444') }}>
              {isSuccess ? 'Successful (00)' : (isPending ? 'Pending (22)' : `Failed (${paymentData.status || '11'})`)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Order ID</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{paymentData.orderid || 'N/A'}</span>
          </div>

          {paymentData.tranID && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Transaction ID</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{paymentData.tranID}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Amount</span>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-accent)' }}>
              {paymentData.currency || 'MYR'} {paymentData.amount || '0.00'}
            </span>
          </div>

          {paymentData.channel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Channel</span>
              <span style={{ color: 'var(--color-text-main)' }}>{paymentData.channel}</span>
            </div>
          )}

          {paymentData.paydate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Date & Time</span>
              <span style={{ color: 'var(--color-text-main)' }}>{paymentData.paydate}</span>
            </div>
          )}

          {paymentData.appcode && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Bank Approval Code</span>
              <span style={{ color: 'var(--color-text-main)' }}>{paymentData.appcode}</span>
            </div>
          )}

          {paymentData.error_desc && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
              <span style={{ color: '#ef4444' }}>Reason</span>
              <span style={{ color: '#ef4444', fontWeight: 500 }}>{paymentData.error_desc}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <button
            onClick={() => {
              const statusMap = { '00': 'SUCCESSFUL (00)', '11': 'FAILED (11)', '22': 'PENDING (22)' };
              const summary = Object.entries(paymentData)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n');
              window.alert(`💳 FIUU PAYMENT RESPONSE:\n\n${summary}`);
            }}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-main)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ExternalLink size={16} /> Re-Show Payment Alert
          </button>

          <button
            onClick={() => navigate('/online-booking')}
            style={{
              padding: '14px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--color-accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={18} /> Back to Online Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
