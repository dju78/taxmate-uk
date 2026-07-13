import { useState } from 'react';
import { Button, Alert } from './components';
import { isValidAmount, isValidDateString, formatLocalDate } from './validation';
import { storageService } from './storage';
import { EXPENSE_CATEGORIES } from './types';
import type { ExpenseRecord, ExpenseCategory } from './types';

const PAYMENT_METHODS = ['Card', 'Bank Transfer', 'Cash', 'Cheque'] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

interface ExpenseFormData {
  date: string;
  merchant: string;
  description: string;
  // Tightened to the approved enum rather than plain string.
  category: ExpenseCategory;
  amount: string;
  paymentMethod: PaymentMethod;
  notes: string;
  taxTreatment: 'allowable' | 'not-allowable' | 'needs-review';
}

type ExpenseFormErrors = Partial<Record<keyof ExpenseFormData, string>>;

interface ExpenseFormProps {
  initialData?: ExpenseRecord | null;
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
}

const labelCls = 'mb-1 block text-[13px] font-semibold text-neutral-700';
const fieldCls =
  'box-border w-full rounded-lg border-2 border-neutral-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-green-500';
const fieldErrCls =
  'box-border w-full rounded-lg border-2 border-red-600 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-red-500';
const errCls = 'mt-1 text-[13px] text-red-600';

const isKnownCategory = (v: string): v is ExpenseCategory =>
  (EXPENSE_CATEGORIES as readonly string[]).includes(v);
const isKnownMethod = (v: string): v is PaymentMethod =>
  (PAYMENT_METHODS as readonly string[]).includes(v);

export const ExpenseForm = ({ initialData = null, onSubmit, onCancel }: ExpenseFormProps) => {
  const [formData, setFormData] = useState<ExpenseFormData>(() =>
    initialData
      ? {
          date: initialData.date,
          merchant: initialData.merchant,
          description: initialData.description ?? '',
          category: isKnownCategory(initialData.category) ? initialData.category : EXPENSE_CATEGORIES[0],
          amount: initialData.amount,
          paymentMethod: isKnownMethod(initialData.paymentMethod ?? '') ? (initialData.paymentMethod as PaymentMethod) : 'Card',
          notes: initialData.notes ?? '',
          taxTreatment: initialData.taxTreatment ?? 'allowable',
        }
      : {
          // Use local wall-clock date to avoid BST UTC midnight off-by-one.
          date: formatLocalDate(new Date()),
          merchant: '',
          description: '',
          category: EXPENSE_CATEGORIES[0],
          amount: '',
          paymentMethod: 'Card',
          notes: '',
          taxTreatment: 'allowable',
        }
  );

  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDuplicateFlow, setShowDuplicateFlow] = useState(false);

  // Derived (not state + effect): recomputed synchronously from the current
  // form values on every render, so it stays in sync with formData with no
  // effect required.
  const duplicateRecord: ExpenseRecord | null =
    formData.amount && formData.merchant
      ? storageService.findDuplicateExpense(formData, initialData?.id) ?? null
      : null;

  const validateForm = (): boolean => {
    const newErrors: ExpenseFormErrors = {};
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ExpenseFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (showDuplicateFlow) {
      setShowDuplicateFlow(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;

    if (duplicateRecord && !showDuplicateFlow) {
      setShowDuplicateFlow(true);
      return;
    }

    try {
      onSubmit(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save expense record');
    }
  };

  // One field renderer keeps every label/error relationship hard-linked.
  const err = (key: keyof ExpenseFormData, id: string) =>
    errors[key] ? (
      <div id={`${id}-error`} role="alert" className={errCls}>
        {errors[key]}
      </div>
    ) : null;
  const aria = (key: keyof ExpenseFormData, id: string) => ({
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `${id}-error` : undefined,
  });

  return (
    <div className="w-full max-w-[500px]">
      {submitError && <Alert variant="error" title="Error" description={submitError} />}

      {showDuplicateFlow ? (
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="text-lg font-bold text-yellow-900">Possible Duplicate Detected</h3>
          <p className="text-sm text-yellow-800">
            A record for <strong>£{formData.amount}</strong> from <strong>{formData.merchant}</strong> on{' '}
            <strong>{formData.date}</strong> already exists.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowDuplicateFlow(false)}>
              Review existing record
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 border border-neutral-300">
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setShowDuplicateFlow(false);
                  onSubmit(formData);
                }}
                className="flex-1 !bg-yellow-600 hover:!bg-yellow-700"
              >
                Save anyway
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="expense-date" className={labelCls}>
              Date *
            </label>
            <input
              id="expense-date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? fieldErrCls : fieldCls}
              {...aria('date', 'expense-date')}
            />
            {err('date', 'expense-date')}
          </div>

          <div>
            <label htmlFor="expense-merchant" className={labelCls}>
              Merchant or Vendor *
            </label>
            <input
              id="expense-merchant"
              type="text"
              name="merchant"
              placeholder="e.g., Amazon, Local Supplier"
              value={formData.merchant}
              onChange={handleChange}
              className={errors.merchant ? fieldErrCls : fieldCls}
              {...aria('merchant', 'expense-merchant')}
            />
            {err('merchant', 'expense-merchant')}
          </div>

          <div>
            <label htmlFor="expense-description" className={labelCls}>
              Description
            </label>
            <textarea
              id="expense-description"
              name="description"
              placeholder="Brief description of the expense"
              value={formData.description}
              onChange={handleChange}
              className={`${fieldCls} min-h-20`}
            />
          </div>

          <div>
            <label htmlFor="expense-category" className={labelCls}>
              Category *
            </label>
            <select
              id="expense-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? fieldErrCls : fieldCls}
              {...aria('category', 'expense-category')}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {err('category', 'expense-category')}
          </div>

          <div>
            <label htmlFor="expense-amount" className={labelCls}>
              Amount (£) *
            </label>
            <input
              id="expense-amount"
              type="number"
              name="amount"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={errors.amount ? fieldErrCls : fieldCls}
              {...aria('amount', 'expense-amount')}
            />
            {err('amount', 'expense-amount')}
          </div>

          <div>
            <label htmlFor="expense-method" className={labelCls}>
              Payment Method *
            </label>
            <select
              id="expense-method"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className={errors.paymentMethod ? fieldErrCls : fieldCls}
              {...aria('paymentMethod', 'expense-method')}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {err('paymentMethod', 'expense-method')}
          </div>

          <div>
            <label htmlFor="expense-tax-treatment" className={labelCls}>
              Tax Treatment *
            </label>
            <select
              id="expense-tax-treatment"
              name="taxTreatment"
              value={formData.taxTreatment}
              onChange={handleChange}
              className={fieldCls}
            >
              <option value="allowable">Allowable expense</option>
              <option value="not-allowable">Not allowable</option>
              <option value="needs-review">Needs review</option>
            </select>
          </div>

          <div>
            <label htmlFor="expense-notes" className={labelCls}>
              Notes
            </label>
            <textarea
              id="expense-notes"
              name="notes"
              placeholder="Receipt number, project reference, etc. (optional)"
              value={formData.notes}
              onChange={handleChange}
              className={`${fieldCls} min-h-16`}
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {initialData ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
