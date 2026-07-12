import { useState } from 'react';
import { TOKENS } from './tokens';
import { Button, Input, Alert } from './components';
import { isValidAmount, isValidDateString } from './validation';

export const ExpenseForm = ({ initialData = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      description: '',
      category: 'Supplies',
      amount: '',
      paymentMethod: 'Card',
      notes: '',
    }
  );

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const categories = ['Supplies', 'Equipment', 'Software', 'Travel', 'Utilities', 'Other'];
  const paymentMethods = ['Card', 'Bank Transfer', 'Cash', 'Cheque'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (!isValidDateString(formData.date)) {
      newErrors.date = 'Enter a valid calendar date';
    }

    if (!formData.merchant.trim()) {
      newErrors.merchant = 'Merchant or vendor is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (!isValidAmount(formData.amount)) {
      newErrors.amount = 'Enter an amount greater than zero (up to 2 decimal places)';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    try {
      onSubmit(formData);
    } catch (error) {
      setSubmitError(error.message || 'Failed to save expense record');
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px' }}>
      {submitError && (
        <Alert variant="error" title="Error" description={submitError} />
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Date */}
        <div>
          <label htmlFor="expense-date" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Date
          </label>
          <Input
            id="expense-date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            error={!!errors.date}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'expense-date-error' : undefined}
            style={{ borderColor: errors.date ? TOKENS.colors.semantic.danger : undefined }}
          />
          {errors.date && (
            <div id="expense-date-error" role="alert" style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.date}
            </div>
          )}
        </div>

        {/* Merchant */}
        <div>
          <label htmlFor="expense-merchant" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Merchant or Vendor *
          </label>
          <Input
            id="expense-merchant"
            type="text"
            name="merchant"
            placeholder="e.g., Amazon, Local Supplier"
            value={formData.merchant}
            onChange={handleChange}
            error={!!errors.merchant}
            aria-invalid={!!errors.merchant}
            aria-describedby={errors.merchant ? 'expense-merchant-error' : undefined}
          />
          {errors.merchant && (
            <div id="expense-merchant-error" role="alert" style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.merchant}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Description
          </label>
          <textarea
            name="description"
            placeholder="Brief description of the expense"
            value={formData.description}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${TOKENS.colors.neutral[200]}`,
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              boxSizing: 'border-box',
              minHeight: '80px',
            }}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="expense-category" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Category *
          </label>
          <select
            id="expense-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${TOKENS.colors.neutral[200]}`,
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <div style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.category}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="expense-amount" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Amount (£) *
          </label>
          <Input
            id="expense-amount"
            type="number"
            name="amount"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            error={!!errors.amount}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
          />
          {errors.amount && (
            <div id="expense-amount-error" role="alert" style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.amount}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="expense-method" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Payment Method *
          </label>
          <select
            id="expense-method"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${TOKENS.colors.neutral[200]}`,
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          {errors.paymentMethod && (
            <div style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.paymentMethod}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Notes
          </label>
          <textarea
            name="notes"
            placeholder="Receipt number, project reference, etc. (optional)"
            value={formData.notes}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${TOKENS.colors.neutral[200]}`,
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              boxSizing: 'border-box',
              minHeight: '60px',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initialData ? 'Update Expense' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
};
