import { describe, it, expect } from 'vitest';
import { calculatePaye } from '../paye';
import { PayeInput } from '../types';
import { toPence } from '../money';

describe('PAYE Net Income Calculator', () => {
  const createInput = (grossSalaryPounds: number, taxRegion: PayeInput['taxRegion'] = 'england'): PayeInput => ({
    taxYear: '2024-25',
    taxRegion,
    grossSalary: toPence(grossSalaryPounds),
  });

  it('1. Salary below the Primary Threshold pays no Income Tax or NIC', () => {
    const res = calculatePaye(createInput(8000));
    expect(res.taxableIncome).toBe(0);
    expect(res.totalIncomeTax).toBe(0);
    expect(res.class1NICs).toBe(0);
    expect(res.netIncome).toBe(toPence(8000));
  });

  it('2. £30,000 salary (Basic Rate)', () => {
    const res = calculatePaye(createInput(30000));
    expect(res.taxableIncome).toBe(toPence(17430));
    expect(res.totalIncomeTax).toBe(toPence(3486.00));
    expect(res.class1NICs).toBe(toPence(1394.40));
    expect(res.netIncome).toBe(toPence(25119.60));
  });

  it('3. £60,000 salary (Higher Rate)', () => {
    const res = calculatePaye(createInput(60000));
    expect(res.taxableIncome).toBe(toPence(47430));
    expect(res.totalIncomeTax).toBe(toPence(11432.00));
    expect(res.class1NICs).toBe(toPence(3210.60));
    expect(res.netIncome).toBe(toPence(45357.40));
  });

  it('4. £110,000 salary (tapered Personal Allowance) — shares the same PA/band logic as the sole-trader engine', () => {
    const res = calculatePaye(createInput(110000));
    expect(res.personalAllowanceUsed).toBe(toPence(7570));
    expect(res.taxableIncome).toBe(toPence(102430));
    expect(res.totalIncomeTax).toBe(toPence(33432.00));
    expect(res.class1NICs).toBe(toPence(4210.60));
    expect(res.netIncome).toBe(toPence(72357.40));
  });

  it('5. monthlyNetIncome is annual net income divided by 12', () => {
    const res = calculatePaye(createInput(30000));
    expect(res.monthlyNetIncome).toBe(Math.round(res.netIncome / 12));
  });

  it('6. blocks Scotland with the correct message', () => {
    expect(() => calculatePaye(createInput(30000, 'scotland'))).toThrow('Scottish tax rules are not supported');
  });

  it('7. always discloses that student loan repayments/benefits-in-kind are not modelled', () => {
    const res = calculatePaye(createInput(30000));
    expect(res.warnings.some((w) => w.includes('student loan repayments'))).toBe(true);
  });

  it('8. adds a Personal Allowance taper warning only above £100,000', () => {
    const below = calculatePaye(createInput(90000));
    expect(below.warnings.some((w) => w.includes('Personal Allowance has been reduced'))).toBe(false);

    const above = calculatePaye(createInput(110000));
    expect(above.warnings.some((w) => w.includes('Personal Allowance has been reduced'))).toBe(true);
  });

  it('9. rejects an unsupported tax year', () => {
    const input = createInput(30000);
    input.taxYear = '2099-00';
    expect(() => calculatePaye(input)).toThrow('Unsupported tax year');
  });

  describe('pension contribution (salary sacrifice)', () => {
    it('10. defaults to 0% when not specified — no change from the baseline calculation', () => {
      const res = calculatePaye(createInput(30000));
      expect(res.pensionContributionPercent).toBe(0);
      expect(res.pensionContribution).toBe(0);
      expect(res.netIncome).toBe(toPence(25119.60));
    });

    it('11. deducts the pension percentage before Income Tax and NIC are calculated', () => {
      const input = createInput(30000);
      input.pensionContributionPercent = 5;
      const res = calculatePaye(input);

      const pensionableSalary = toPence(30000) - toPence(1500); // 5% of £30,000
      expect(res.pensionContribution).toBe(toPence(1500));
      expect(res.taxableIncome + res.personalAllowanceUsed).toBe(pensionableSalary);
      expect(res.netIncome).toBe(input.grossSalary - res.totalIncomeTax - res.class1NICs - res.pensionContribution);
    });

    it('12. clamps out-of-range percentages to 0-10', () => {
      const tooHigh = createInput(30000);
      tooHigh.pensionContributionPercent = 25;
      expect(calculatePaye(tooHigh).pensionContributionPercent).toBe(10);

      const negative = createInput(30000);
      negative.pensionContributionPercent = -5;
      expect(calculatePaye(negative).pensionContributionPercent).toBe(0);
    });

    it('13. discloses the assumed pension percentage only when greater than 0', () => {
      const withPension = createInput(30000);
      withPension.pensionContributionPercent = 8;
      expect(calculatePaye(withPension).warnings.some((w) => w.includes('salary sacrifice pension contribution of 8%'))).toBe(true);

      const withoutPension = calculatePaye(createInput(30000));
      expect(withoutPension.warnings.some((w) => w.includes('salary sacrifice'))).toBe(false);
    });
  });

  describe('tax codes', () => {
    it('14. an L code decodes to allowance = number*10 + 9 (standard HMRC convention)', () => {
      const input = createInput(40000);
      input.taxCode = '1257L';
      const res = calculatePaye(input);

      // 1257L decodes to a £12,579 allowance (code * 10 + 9) — £9 more than
      // the exact £12,570 Personal Allowance. This small rounding buffer is
      // the standard HMRC tax-code convention, not an approximation error.
      expect(res.personalAllowanceUsed).toBe(toPence(12579));
      expect(res.taxableIncome).toBe(toPence(40000) - toPence(12579));
      expect(res.taxCode).toBe('1257L');
    });

    it('15. BR taxes the whole amount at basic rate with no Personal Allowance', () => {
      const input = createInput(20000);
      input.taxCode = 'BR';
      const res = calculatePaye(input);

      expect(res.personalAllowanceUsed).toBe(0);
      expect(res.taxableIncome).toBe(toPence(20000));
      expect(res.totalIncomeTax).toBe(toPence(4000)); // 20% of £20,000
    });

    it('16. NT applies no Income Tax at all', () => {
      const input = createInput(50000);
      input.taxCode = 'NT';
      const res = calculatePaye(input);

      expect(res.totalIncomeTax).toBe(0);
    });

    it('17. a K code adds the negative allowance to taxable income', () => {
      const input = createInput(30000);
      input.taxCode = 'K475';
      const res = calculatePaye(input);

      // K475 => notional allowance of -£4,759, so taxable income exceeds gross salary.
      expect(res.taxableIncome).toBe(toPence(30000) + toPence(4759));
    });

    it('18. an explicit tax code suppresses the automatic Personal Allowance taper warning', () => {
      const input = createInput(110000);
      input.taxCode = '1257L';
      const res = calculatePaye(input);

      expect(res.warnings.some((w) => w.includes('Personal Allowance has been reduced'))).toBe(false);
      expect(res.warnings.some((w) => w.includes('Tax calculated using tax code'))).toBe(true);
    });

    it('19. rejects an unrecognised tax code', () => {
      const input = createInput(30000);
      input.taxCode = 'ZZ99';
      expect(() => calculatePaye(input)).toThrow('UNRECOGNISED_TAX_CODE');
    });
  });
});
