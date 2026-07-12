import { useState } from 'react';
import { TOKENS } from './tokens';
import { Button, Input, Alert } from './components';
import { INCOME_STATUS, INCOME_STATUS_LABELS, INCOME_STATUS_OPTIONS } from './storage';
import { isValidAmount, isValidDateString } from './validation';

export const IncomeForm = ({ initialData = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      date: new Date().toISOString().split('T')[0],
      source: '',
      description: '',
      category: 'Client work',
      amount: '',
      status: INCOME_STATUS.RECEIVED,
      notes: '',
    }
  );

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const categories = ['Client work', 'Freelance', 'Passive income', 'Other'];
  const statuses = INCOME_STATUS_OPTIONS;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (!isValidDateString(formData.date)) {
      newErrors.date = 'Enter a valid calendar date';
    }

    if (!formData.source.trim()) {
      newErrors.source = 'Client or income source is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (!isValidAmount(formData.amount)) {
      newErrors.amount = 'Enter an amount greater than zero (up to 2 decimal places)';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
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
      setSubmitError(error.message || 'Failed to save income record');
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
          <label htmlFor="income-date" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Date
          </label>
          <Input
            id="income-date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            error={!!errors.date}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'income-date-error' : undefined}
            style={{ borderColor: errors.date ? TOKENS.colors.semantic.danger : undefined }}
          />
          {errors.date && (
            <div id="income-date-error" role="alert" style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.date}
            </div>
          )}
        </div>

        {/* Source */}
        <div>
          <label htmlFor="income-source" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Client or Income Source *
          </label>
          <Input
            id="income-source"
            type="text"
            name="source"
            placeholder="e.g., Acme Corp, Freelance Project"
            value={formData.source}
            onChange={handleChange}
            error={!!errors.source}
            aria-invalid={!!errors.source}
            aria-describedby={errors.source ? 'income-source-error' : undefined}
          />
          {errors.source && (
            <div id="income-source-error" role="alert" style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.source}
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
            placeholder="Brief description of the work or service"
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
          <label htmlFor="income-category" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Category *
          </label>
          <select
            id="income-category"
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
          <label htmlFor="income-amount" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Amount (£) *
          </label>
          <Input
            id="income-amount"
            type="number"
            name="amount"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            error={!!errors.amount}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? 'income-amount-error' : undefined}
          />
          {errors.amount && (
            <div id="income-amount-error" role="alert" style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.amount}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="income-status" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: TOKENS.colors.neutral[700], marginBottom: '4px' }}>
            Status *
          </label>
          <select
            id="income-status"
            name="status"
            value={formData.status}
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
            {statuses.map(status => (
              <option key={status} value={status}>{INCOME_STATUS_LABELS[status]}</option>
            ))}
          </select>
          {errors.status && (
            <div style={{ fontSize: '13px', color: TOKENS.colors.semantic.danger, marginTop: '4px' }}>
              {errors.status}
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
            placeholder="Any additional notes (optional)"
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
            {initialData ? 'Update Income' : 'Add Income'}
          </Button>
        </div>
      </form>
    </div>
  );
};
